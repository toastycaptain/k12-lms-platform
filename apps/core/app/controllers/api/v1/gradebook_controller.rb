module Api
  module V1
    class GradebookController < ApplicationController
      before_action :set_course

      # GET /api/v1/courses/:id/gradebook
      def show
        authorize @course, :gradebook?

        render json: gradebook_payload
      end

      # GET /api/v1/courses/:id/gradebook/export
      def export
        authorize @course, :gradebook_export?

        csv_data = GradebookExportService.new(course: @course, payload: gradebook_payload).call
        send_data csv_data,
                  filename: "gradebook-#{@course.id}-#{Date.current}.csv",
                  type: "text/csv"
      end

      private

      def set_course
        @course = Course.includes(
          sections: { enrollments: :user },
          assignments: %i[rubric resource_links],
          quizzes: :quiz_attempts
        ).find(params[:id])
      end

      def gradebook_payload
        @gradebook_payload ||= begin
          student_rows = students.map { |student| build_student_row(student) }
          assignment_rows = assignments.map { |assignment| build_assignment_summary(assignment) }

          {
            students: student_rows,
            assignments: assignment_rows,
            quizzes: quizzes.map { |quiz| serialize_quiz(quiz) },
            course_summary: build_course_summary(student_rows, assignment_rows),
            mastery_threshold: mastery_threshold
          }
        end
      end

      def students
        @students ||= User.joins(:enrollments)
          .where(enrollments: { section_id: @course.sections.select(:id), role: "student" })
          .distinct
          .order(:last_name, :first_name)
          .to_a
      end

      def assignments
        @assignments ||= @course.assignments.to_a.sort_by { |assignment| [ assignment.due_at || Time.zone.at(0), assignment.id ] }
      end

      def quizzes
        @quizzes ||= @course.quizzes.to_a.sort_by { |quiz| [ quiz.title.to_s, quiz.id ] }
      end

      def submissions
        @submissions ||= Submission.where(assignment_id: assignments.map(&:id), user_id: students.map(&:id))
          .includes(:assignment)
          .to_a
      end

      def quiz_attempts
        @quiz_attempts ||= QuizAttempt.where(quiz_id: quizzes.map(&:id), user_id: students.map(&:id))
          .includes(:quiz)
          .to_a
      end

      def submissions_by_student
        @submissions_by_student ||= submissions.group_by(&:user_id).transform_values do |rows|
          rows.index_by(&:assignment_id)
        end
      end

      def submissions_by_assignment
        @submissions_by_assignment ||= submissions.group_by(&:assignment_id)
      end

      def quiz_attempts_by_student
        @quiz_attempts_by_student ||= quiz_attempts.group_by(&:user_id)
      end

      def standard_assignment_map
        @standard_assignment_map ||= AssignmentStandard.where(assignment_id: assignments.map(&:id))
          .pluck(:standard_id, :assignment_id)
          .group_by(&:first)
          .transform_values { |rows| rows.map(&:second).uniq }
      end

      def build_student_row(student)
        submission_lookup = submissions_by_student.fetch(student.id, {})
        attempts = quiz_attempts_by_student.fetch(student.id, [])
        latest_quiz_attempts = latest_attempts_by_quiz(attempts)

        grade_cells = assignments.map do |assignment|
          build_grade_cell(assignment, submission_lookup[assignment.id])
        end

        quiz_cells = quizzes.map do |quiz|
          build_quiz_cell(quiz, latest_quiz_attempts[quiz.id])
        end

        {
          id: student.id,
          name: "#{student.first_name} #{student.last_name}",
          email: student.email,
          grades: grade_cells,
          quiz_grades: quiz_cells,
          course_average: calculate_course_average(grade_cells, quiz_cells),
          missing_count: grade_cells.count { |cell| cell[:missing] },
          late_count: grade_cells.count { |cell| cell[:late] },
          mastery: build_mastery(grade_cells)
        }
      end

      def build_grade_cell(assignment, submission)
        points_possible = assignment.points_possible.to_f
        grade_value = submission&.grade&.to_f
        percentage = if grade_value.present? && points_possible.positive?
          ((grade_value / points_possible) * 100).round(2)
        end

        submitted = submission.present? && %w[submitted graded returned].include?(submission.status)
        late = late_submission?(submission, assignment)
        missing = missing_submission?(submission, assignment)

        {
          assignment_id: assignment.id,
          assignment_title: assignment.title,
          assignment_type: assignment.assignment_type,
          submission_id: submission&.id,
          grade: grade_value,
          points_possible: points_possible.positive? ? points_possible : nil,
          percentage: percentage,
          status: submission&.status || (missing ? "missing" : "not_submitted"),
          submitted: submitted,
          late: late,
          missing: missing,
          due_at: assignment.due_at,
          submitted_at: submission&.submitted_at
        }
      end

      def build_quiz_cell(quiz, attempt)
        {
          quiz_id: quiz.id,
          title: quiz.title,
          attempt_id: attempt&.id,
          score: attempt&.score&.to_f,
          points_possible: quiz.points_possible&.to_f,
          percentage: attempt&.percentage&.to_f,
          status: attempt&.status || "not_attempted",
          submitted_at: attempt&.submitted_at
        }
      end

      def build_assignment_summary(assignment)
        assignment_submissions = submissions_by_assignment.fetch(assignment.id, [])
        graded_submissions = assignment_submissions.select { |submission| submission.grade.present? }
        percentages = graded_submissions.map do |submission|
          percentage_for_grade(submission.grade, assignment.points_possible)
        end.compact

        {
          id: assignment.id,
          title: assignment.title,
          due_at: assignment.due_at,
          points_possible: assignment.points_possible&.to_f,
          submission_count: assignment_submissions.count,
          graded_count: graded_submissions.count,
          average: percentages.any? ? average(percentages) : nil,
          median: percentages.any? ? median(percentages) : nil
        }
      end

      def build_course_summary(student_rows, assignment_rows)
        course_averages = student_rows.map { |row| row[:course_average] }.compact
        total_grade_cells = student_rows.sum { |row| row[:grades].length }
        submitted_cells = student_rows.sum { |row| row[:grades].count { |cell| cell[:submitted] } }

        {
          student_count: student_rows.count,
          assignment_count: assignment_rows.count,
          quiz_count: quizzes.count,
          overall_average: course_averages.any? ? average(course_averages) : nil,
          grade_distribution: grade_distribution(course_averages),
          assignment_completion_rate: total_grade_cells.positive? ? ((submitted_cells.to_f / total_grade_cells) * 100).round(2) : 0.0,
          students_with_missing_work: student_rows.count { |row| row[:missing_count].positive? },
          category_averages: category_averages(student_rows)
        }
      end

      def category_averages(student_rows)
        assignment_values = student_rows.flat_map { |row| row[:grades] }
        quiz_values = student_rows.flat_map { |row| row[:quiz_grades] }

        by_category = assignment_values.group_by { |cell| cell[:assignment_type] }
        averages = by_category.transform_values do |cells|
          percentages = cells.map { |cell| cell[:percentage] }.compact
          percentages.any? ? average(percentages) : nil
        end

        quiz_percentages = quiz_values.map { |cell| cell[:percentage] }.compact
        averages["quiz"] = average(quiz_percentages) if quiz_percentages.any?

        averages
      end

      def build_mastery(grade_cells)
        return nil if standard_assignment_map.empty?

        percentage_by_assignment = grade_cells.index_by { |cell| cell[:assignment_id] }
        standard_scores = standard_assignment_map.map do |standard_id, assignment_ids|
          met_count = assignment_ids.count do |assignment_id|
            percentage = percentage_by_assignment.dig(assignment_id, :percentage)
            percentage.present? && percentage >= mastery_threshold
          end
          total = assignment_ids.count
          score = total.positive? ? ((met_count.to_f / total) * 100).round(2) : 0.0

          {
            standard_id: standard_id,
            score: score,
            mastered: score >= mastery_threshold
          }
        end

        mastered_standards = standard_scores.count { |entry| entry[:mastered] }

        {
          threshold: mastery_threshold,
          mastered_standards: mastered_standards,
          total_standards: standard_scores.count,
          percentage: standard_scores.any? ? average(standard_scores.map { |entry| entry[:score] }) : nil
        }
      end

      def mastery_threshold
        (Current.tenant&.settings&.dig("mastery_threshold") || 80).to_f
      end

      def grade_distribution(values)
        distribution = { "A" => 0, "B" => 0, "C" => 0, "D" => 0, "F" => 0 }

        values.each do |value|
          case value
          when 90..100
            distribution["A"] += 1
          when 80...90
            distribution["B"] += 1
          when 70...80
            distribution["C"] += 1
          when 60...70
            distribution["D"] += 1
          else
            distribution["F"] += 1
          end
        end

        distribution
      end

      def latest_attempts_by_quiz(attempts)
        attempts.group_by(&:quiz_id).transform_values do |records|
          records.max_by { |record| [ record.attempt_number.to_i, record.submitted_at || Time.zone.at(0), record.id ] }
        end
      end

      def calculate_course_average(grade_cells, quiz_cells)
        earned = 0.0
        possible = 0.0

        grade_cells.each do |cell|
          next if cell[:grade].blank? || cell[:points_possible].blank? || cell[:points_possible].to_f <= 0

          earned += cell[:grade].to_f
          possible += cell[:points_possible].to_f
        end

        quiz_cells.each do |cell|
          next if cell[:score].blank? || cell[:points_possible].blank? || cell[:points_possible].to_f <= 0

          earned += cell[:score].to_f
          possible += cell[:points_possible].to_f
        end

        return nil unless possible.positive?

        ((earned / possible) * 100).round(2)
      end

      def percentage_for_grade(grade, points_possible)
        return nil if grade.blank? || points_possible.blank? || points_possible.to_f <= 0

        ((grade.to_f / points_possible.to_f) * 100).round(2)
      end

      def average(values)
        return nil if values.empty?

        (values.sum.to_f / values.length).round(2)
      end

      def median(values)
        return nil if values.empty?

        sorted = values.sort
        midpoint = sorted.length / 2

        if sorted.length.odd?
          sorted[midpoint].round(2)
        else
          ((sorted[midpoint - 1] + sorted[midpoint]) / 2.0).round(2)
        end
      end

      def late_submission?(submission, assignment)
        return false if submission.blank? || assignment.due_at.blank? || submission.submitted_at.blank?

        submission.submitted_at > assignment.due_at
      end

      def missing_submission?(submission, assignment)
        return false if assignment.due_at.blank? || assignment.due_at >= Time.current

        submission.blank? || submission.submitted_at.blank?
      end

      def serialize_quiz(quiz)
        {
          id: quiz.id,
          title: quiz.title,
          points_possible: quiz.points_possible&.to_f
        }
      end
    end
  end
end
