require "set"

module Api
  module V1
    class StudentProgressController < ApplicationController
      before_action :set_student
      before_action :authorize_student_progress

      # GET /api/v1/students/:student_id/progress
      def show
        courses = accessible_courses.includes(:assignments).to_a
        standards = standards_mastery(courses)
        course_summaries = course_progress(courses)

        render json: {
          student: student_payload(@student),
          courses: course_summaries,
          standards_mastery: standards,
          overall: overall_summary(course_summaries, standards)
        }
      end

      # GET /api/v1/students/:student_id/progress/course/:course_id
      def course_detail
        course = accessible_courses.find(params[:course_id])

        render json: {
          course: {
            id: course.id,
            name: course.name,
            code: course.code
          },
          assignments: assignment_progress(course),
          quizzes: quiz_progress(course),
          module_completion: module_progress(course),
          standards: course_standards_mastery(course),
          grade_trend: grade_trend(course)
        }
      end

      private

      def set_student
        @student = User.find(params[:student_id])
      end

      def authorize_student_progress
        authorize @student, :show?, policy_class: StudentProgressPolicy
      end

      def accessible_courses
        @accessible_courses ||= begin
          scope = enrolled_courses(@student)
          if teacher_limited_view?
            scope = scope.where(id: taught_course_ids)
          end
          scope
        end
      end

      def enrolled_courses(student)
        Course.joins(sections: :enrollments)
              .where(enrollments: { user_id: student.id, role: "student" })
              .distinct
              .order(:name, :id)
      end

      def teacher_limited_view?
        Current.user.has_role?(:teacher) &&
          !Current.user.has_role?(:admin) &&
          !Current.user.has_role?(:district_admin) &&
          !student_viewer? &&
          !guardian_viewer?
      end

      def student_viewer?
        Current.user.has_role?(:student) && Current.user.id == @student.id
      end

      def guardian_viewer?
        return false unless Current.user.has_role?(:guardian)

        GuardianLink.active.exists?(guardian_id: Current.user.id, student_id: @student.id)
      end

      def taught_course_ids
        @taught_course_ids ||= Enrollment.joins(:section)
                                         .where(user_id: Current.user.id, role: "teacher")
                                         .distinct
                                         .pluck("sections.course_id")
      end

      def student_payload(student)
        {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          name: [ student.first_name, student.last_name ].compact.join(" ").strip
        }
      end

      def course_progress(courses)
        courses.map do |course|
          assignments = course.assignments.to_a
          assignment_ids = assignments.map(&:id)
          submissions = submissions_for_assignment_ids(assignment_ids)
          completed_count = submissions.count { |row| completed_submission?(row) }
          total_assignments = assignments.length

          {
            id: course.id,
            name: course.name,
            code: course.code,
            average: assignment_average(submissions),
            completed_assignments: completed_count,
            total_assignments: total_assignments,
            completion_rate: percentage(completed_count, total_assignments)
          }
        end
      end

      def standards_mastery(courses)
        course_ids = courses.map(&:id)
        return [] if course_ids.empty?

        assignment_ids = Assignment.where(course_id: course_ids).pluck(:id)
        assignments = Assignment.includes(standards: :standard_framework).where(id: assignment_ids)
        submissions = graded_submissions_by_assignment_id(assignment_ids)

        mastery_rows(assignments, submissions)
      end

      def course_standards_mastery(course)
        assignments = course.assignments.includes(standards: :standard_framework).to_a
        submissions = graded_submissions_by_assignment_id(assignments.map(&:id))

        mastery_rows(assignments, submissions)
      end

      def mastery_rows(assignments, submissions_by_assignment_id)
        buckets = {}

        assignments.each do |assignment|
          submission = submissions_by_assignment_id[assignment.id]
          percentage_score = percentage_for_grade(submission&.grade, assignment.points_possible)
          next if percentage_score.nil?

          assignment.standards.each do |standard|
            buckets[standard.id] ||= {
              standard: standard,
              scores: []
            }
            buckets[standard.id][:scores] << percentage_score
          end
        end

        buckets.values.map do |entry|
          score_average = average(entry[:scores])
          standard = entry[:standard]

          {
            id: standard.id,
            code: standard.code,
            description: standard.description,
            framework: standard.standard_framework&.name,
            average_score: score_average,
            mastered: score_average.present? && score_average >= mastery_threshold,
            attempt_count: entry[:scores].size
          }
        end.sort_by { |entry| [ entry[:code].to_s, entry[:id] ] }
      end

      def assignment_progress(course)
        assignments = course.assignments.order(:due_at, :id)
        submissions_by_assignment = submissions_for_assignment_ids(assignments.map(&:id))
          .index_by(&:assignment_id)

        assignments.map do |assignment|
          submission = submissions_by_assignment[assignment.id]
          grade_percentage = percentage_for_grade(submission&.grade, assignment.points_possible)

          {
            id: assignment.id,
            title: assignment.title,
            due_at: assignment.due_at,
            status: submission&.status || "not_submitted",
            grade: submission&.grade&.to_f,
            points_possible: assignment.points_possible&.to_f,
            percentage: grade_percentage,
            submitted_at: submission&.submitted_at,
            graded_at: submission&.graded_at
          }
        end
      end

      def quiz_progress(course)
        quizzes = course.quizzes.order(:due_at, :id).to_a
        return [] if quizzes.empty?

        attempts = QuizAttempt.where(quiz_id: quizzes.map(&:id), user_id: @student.id).to_a
        latest_attempts = attempts.group_by(&:quiz_id).transform_values do |rows|
          rows.max_by { |row| [ row.attempt_number.to_i, row.submitted_at || Time.zone.at(0), row.id ] }
        end

        quizzes.map do |quiz|
          attempt = latest_attempts[quiz.id]
          {
            id: quiz.id,
            title: quiz.title,
            due_at: quiz.due_at,
            points_possible: quiz.points_possible&.to_f,
            status: attempt&.status || "not_attempted",
            score: attempt&.score&.to_f,
            percentage: attempt&.percentage&.to_f,
            submitted_at: attempt&.submitted_at,
            attempt_number: attempt&.attempt_number
          }
        end
      end

      def module_progress(course)
        modules = CourseModule.includes(:module_items)
                              .where(course_id: course.id, status: "published")
                              .ordered
                              .to_a
        item_ids = modules.flat_map { |course_module| course_module.module_items.map(&:id) }
        completed_item_ids = module_completed_item_ids(item_ids)

        module_rows = modules.map do |course_module|
          items = course_module.module_items.sort_by(&:position)
          completed_count = items.count { |item| completed_item_ids.include?(item.id) }

          {
            id: course_module.id,
            title: course_module.title,
            total_items: items.size,
            completed_items: completed_count,
            completion_rate: percentage(completed_count, items.size),
            items: items.map do |item|
              {
                id: item.id,
                title: item.title,
                item_type: item.item_type,
                completed: completed_item_ids.include?(item.id)
              }
            end
          }
        end

        total_items = module_rows.sum { |row| row[:total_items] }
        completed_items = module_rows.sum { |row| row[:completed_items] }

        {
          total_modules: module_rows.size,
          total_items: total_items,
          completed_items: completed_items,
          completion_rate: percentage(completed_items, total_items),
          modules: module_rows
        }
      end

      def grade_trend(course)
        assignment_trend = Submission.joins(:assignment)
                                     .where(user_id: @student.id, assignments: { course_id: course.id })
                                     .where.not(graded_at: nil)
                                     .includes(:assignment)
                                     .order(:graded_at)
                                     .map do |submission|
          percentage_value = percentage_for_grade(submission.grade, submission.assignment.points_possible)
          next if percentage_value.nil?

          {
            date: submission.graded_at,
            source_type: "assignment",
            source_id: submission.assignment_id,
            source_title: submission.assignment.title,
            score: submission.grade&.to_f,
            points_possible: submission.assignment.points_possible&.to_f,
            percentage: percentage_value
          }
        end.compact

        quiz_trend = QuizAttempt.joins(:quiz)
                                .where(user_id: @student.id, quizzes: { course_id: course.id })
                                .where.not(submitted_at: nil, percentage: nil)
                                .includes(:quiz)
                                .order(:submitted_at)
                                .map do |attempt|
          {
            date: attempt.submitted_at,
            source_type: "quiz",
            source_id: attempt.quiz_id,
            source_title: attempt.quiz.title,
            score: attempt.score&.to_f,
            points_possible: attempt.quiz.points_possible&.to_f,
            percentage: attempt.percentage&.to_f
          }
        end

        (assignment_trend + quiz_trend).sort_by { |entry| [ entry[:date], entry[:source_type], entry[:source_id] ] }
      end

      def overall_summary(course_summaries, standards_mastery_rows)
        averages = course_summaries.filter_map { |course| course[:average] }
        total_assignments = course_summaries.sum { |course| course[:total_assignments] }
        completed_assignments = course_summaries.sum { |course| course[:completed_assignments] }
        mastered_count = standards_mastery_rows.count { |standard| standard[:mastered] }
        standard_count = standards_mastery_rows.length

        {
          courses_count: course_summaries.length,
          overall_average: averages.any? ? average(averages) : nil,
          total_assignments: total_assignments,
          completed_assignments: completed_assignments,
          completion_rate: percentage(completed_assignments, total_assignments),
          mastered_standards: mastered_count,
          total_standards: standard_count,
          mastery_rate: percentage(mastered_count, standard_count),
          at_risk_courses: course_summaries.count { |course| course[:average].present? && course[:average] < 70.0 }
        }
      end

      def submissions_for_assignment_ids(assignment_ids)
        return [] if assignment_ids.empty?

        Submission.includes(:assignment)
                  .where(assignment_id: assignment_ids, user_id: @student.id)
                  .to_a
      end

      def graded_submissions_by_assignment_id(assignment_ids)
        return {} if assignment_ids.empty?

        Submission.includes(:assignment)
                  .where(assignment_id: assignment_ids, user_id: @student.id)
                  .where.not(grade: nil)
                  .index_by(&:assignment_id)
      end

      def module_completed_item_ids(item_ids)
        return Set.new if item_ids.empty?

        ModuleItemCompletion.where(user_id: @student.id, module_item_id: item_ids)
                            .pluck(:module_item_id)
                            .to_set
      end

      def completed_submission?(submission)
        %w[submitted graded returned].include?(submission.status)
      end

      def assignment_average(submissions)
        percentages = submissions.filter_map do |submission|
          percentage_for_grade(submission.grade, submission.assignment.points_possible)
        end
        return nil if percentages.empty?

        average(percentages)
      end

      def percentage_for_grade(grade, points_possible)
        return nil if grade.nil?

        points = points_possible.to_f
        return nil unless points.positive?

        ((grade.to_f / points) * 100).round(1)
      end

      def percentage(part, total)
        return 0.0 unless total.to_i.positive?

        ((part.to_f / total.to_f) * 100).round(1)
      end

      def average(values)
        return nil if values.empty?

        (values.sum.to_f / values.length).round(1)
      end

      def mastery_threshold
        (Current.tenant&.settings&.dig("mastery_threshold") || 80).to_f
      end
    end
  end
end
