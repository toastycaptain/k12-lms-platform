module Api
  module V1
    class QuizAnalyticsController < ApplicationController
      def show
        quiz = Quiz.includes(:quiz_items, :questions).find(quiz_id_param)
        authorize quiz, :results?

        attempts = quiz.quiz_attempts.where(status: "graded")
        attempt_ids = attempts.pluck(:id)
        answers_by_question_id = AttemptAnswer.where(quiz_attempt_id: attempt_ids).group_by(&:question_id)
        quiz_items = quiz.quiz_items.includes(:question).order(:position)

        render json: {
          quiz_id: quiz.id,
          quiz_title: quiz.title,
          total_attempts: attempts.count,
          unique_students: attempts.select(:user_id).distinct.count,
          score_stats: score_statistics(attempts),
          score_distribution: score_distribution(attempts),
          time_stats: time_statistics(attempts),
          item_analysis: item_analysis(quiz_items, answers_by_question_id)
        }
      end

      def course_summary
        course = Course.find(course_id_param)
        authorize course, :show?

        quizzes = course.quizzes.where(status: %w[published closed]).order(:id)
        attempts = QuizAttempt.where(quiz_id: quizzes.select(:id), status: "graded")
        quizzes_by_id = quizzes.index_by(&:id)
        attempts_by_student_id = attempts.group_by(&:user_id)

        students = User.where(id: attempts_by_student_id.keys).order(:last_name, :first_name)

        student_summaries = students.map do |student|
          student_attempts = attempts_by_student_id[student.id] || []
          scores = student_attempts.map { |attempt| attempt.percentage&.to_f }.compact

          {
            user_id: student.id,
            name: "#{student.first_name} #{student.last_name}".strip,
            quizzes_taken: student_attempts.map(&:quiz_id).uniq.count,
            average_score: scores.any? ? average(scores, precision: 1) : nil,
            highest_score: scores.max,
            lowest_score: scores.min,
            quiz_scores: per_quiz_scores(student_attempts, quizzes_by_id)
          }
        end

        render json: {
          course_id: course.id,
          total_quizzes: quizzes.count,
          total_graded_attempts: attempts.count,
          class_average: attempts.average(:percentage)&.to_f&.round(1),
          students: student_summaries.sort_by { |summary| -(summary[:average_score] || 0) },
          quiz_comparison: quiz_comparison(quizzes, attempts)
        }
      end

      private

      def quiz_id_param
        params[:quiz_id] || params[:id]
      end

      def course_id_param
        params[:course_id] || params[:id]
      end

      def score_statistics(attempts)
        scores = attempts.pluck(:percentage).compact.map(&:to_f)
        return { mean: 0, median: 0, min: 0, max: 0, std_dev: 0 } if scores.empty?

        sorted = scores.sort
        n = sorted.length
        mean = average(sorted)
        median = if n.odd?
          sorted[n / 2]
        else
          (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0
        end
        variance = sorted.sum { |score| (score - mean)**2 } / n.to_f

        {
          mean: mean.round(1),
          median: median.round(1),
          min: sorted.first.round(1),
          max: sorted.last.round(1),
          std_dev: Math.sqrt(variance).round(1)
        }
      end

      def score_distribution(attempts)
        percentages = attempts.pluck(:percentage).compact.map(&:to_f)
        buckets = {
          "0-59" => 0,
          "60-69" => 0,
          "70-79" => 0,
          "80-89" => 0,
          "90-100" => 0
        }

        percentages.each do |percentage|
          case percentage
          when 0...60 then buckets["0-59"] += 1
          when 60...70 then buckets["60-69"] += 1
          when 70...80 then buckets["70-79"] += 1
          when 80...90 then buckets["80-89"] += 1
          else buckets["90-100"] += 1
          end
        end

        buckets
      end

      def time_statistics(attempts)
        times = attempts.pluck(:time_spent_seconds).compact.map(&:to_i)
        return { mean: 0, min: 0, max: 0 } if times.empty?

        {
          mean: average(times, precision: 0).to_i,
          min: times.min,
          max: times.max
        }
      end

      def item_analysis(quiz_items, answers_by_question_id)
        quiz_items.map do |quiz_item|
          question = quiz_item.question
          answers = answers_by_question_id[question.id] || []
          total = answers.length
          correct = answers.count(&:is_correct)
          choice_distribution = choice_distribution(question, answers)

          {
            question_id: question.id,
            question_number: quiz_item.position + 1,
            prompt: question.prompt.to_s.truncate(120),
            full_prompt: question.prompt.to_s,
            question_type: question.question_type,
            points: quiz_item.points || question.points,
            total_responses: total,
            correct_count: correct,
            difficulty: total.positive? ? (correct.to_f / total).round(3) : nil,
            avg_points: total.positive? ? (answers.sum { |answer| answer.points_awarded.to_f } / total).round(2) : nil,
            choice_distribution: choice_distribution.presence,
            choice_labels: choice_labels(question)
          }
        end
      end

      def choice_distribution(question, answers)
        return nil unless %w[multiple_choice true_false multiple_answer].include?(question.question_type)

        distribution = Hash.new(0)

        answers.each do |answer_record|
          extract_choice_values(answer_record.answer).each do |choice|
            normalized_choice = choice.to_s
            distribution[normalized_choice] += 1 if normalized_choice.present?
          end
        end

        distribution
      end

      def choice_labels(question)
        labels = {}

        Array(question.choices).each do |choice|
          next unless choice.is_a?(Hash)

          key = choice["key"] || choice[:key]
          text = choice["text"] || choice[:text]
          labels[key.to_s] = text if key.present? && text.present?
        end

        labels.presence
      end

      def extract_choice_values(answer_payload)
        case answer_payload
        when Array
          answer_payload.flat_map { |value| extract_choice_values(value) }
        when Hash
          if answer_payload.key?("key") || answer_payload.key?(:key)
            [ answer_payload["key"] || answer_payload[:key] ]
          elsif answer_payload.key?("keys") || answer_payload.key?(:keys)
            Array(answer_payload["keys"] || answer_payload[:keys])
          elsif answer_payload.key?("value") || answer_payload.key?(:value)
            [ answer_payload["value"] || answer_payload[:value] ]
          elsif answer_payload.key?("values") || answer_payload.key?(:values)
            Array(answer_payload["values"] || answer_payload[:values])
          else
            answer_payload.values.flat_map { |value| extract_choice_values(value) }
          end
        else
          [ answer_payload ]
        end
      end

      def per_quiz_scores(student_attempts, quizzes_by_id)
        student_attempts
          .group_by(&:quiz_id)
          .map do |quiz_id, quiz_attempts|
            scores = quiz_attempts.map { |attempt| attempt.percentage&.to_f }.compact
            latest_attempt = quiz_attempts.max_by { |attempt| [ attempt.attempt_number.to_i, attempt.id ] }

            {
              quiz_id: quiz_id,
              quiz_title: quizzes_by_id[quiz_id]&.title || "Quiz ##{quiz_id}",
              attempts: quiz_attempts.length,
              average_score: scores.any? ? average(scores, precision: 1) : nil,
              latest_score: latest_attempt&.percentage&.to_f&.round(1)
            }
          end
          .sort_by { |entry| entry[:quiz_title].to_s.downcase }
      end

      def quiz_comparison(quizzes, attempts)
        attempts_by_quiz_id = attempts.group_by(&:quiz_id)

        quizzes.map do |quiz|
          quiz_attempts = attempts_by_quiz_id[quiz.id] || []
          scores = quiz_attempts.map { |attempt| attempt.percentage&.to_f }.compact

          {
            quiz_id: quiz.id,
            title: quiz.title,
            status: quiz.status,
            due_at: quiz.due_at,
            updated_at: quiz.updated_at,
            attempt_count: quiz_attempts.length,
            class_average: scores.any? ? average(scores, precision: 1) : nil
          }
        end
      end

      def average(values, precision: 2)
        return 0 if values.empty?

        (values.sum / values.length.to_f).round(precision)
      end
    end
  end
end
