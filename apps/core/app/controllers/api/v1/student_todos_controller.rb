module Api
  module V1
    class StudentTodosController < ApplicationController
      before_action :set_student
      before_action :authorize_student_data

      def index
        policy_scope(User, policy_scope_class: StudentProgressPolicy::Scope)
        render json: aggregated_todos.sort_by { |todo| todo[:due_at] ? [ 0, todo[:due_at] ] : [ 1, Time.zone.at(0) ] }
      end

      private

      def set_student
        @student = User.find(params[:student_id])
      end

      def authorize_student_data
        authorize @student, :show?, policy_class: StudentProgressPolicy
      end

      def aggregated_todos
        assignment_todos + quiz_todos + goal_todos
      end

      def assignment_todos
        assignments = Assignment
          .where(course_id: enrolled_course_ids, status: "published")
          .order(:due_at, :id)

        submissions_by_assignment = Submission
          .where(assignment_id: assignments.select(:id), user_id: @student.id)
          .index_by(&:assignment_id)

        assignments.filter_map do |assignment|
          submission = submissions_by_assignment[assignment.id]
          next if submission && %w[submitted graded returned].include?(submission.status)

          {
            id: "assignment-#{assignment.id}",
            source_type: "assignment",
            source_id: assignment.id,
            title: assignment.title,
            due_at: assignment.due_at,
            status: submission&.status || "not_submitted",
            course_id: assignment.course_id,
            priority: priority_for_due_at(assignment.due_at)
          }
        end
      end

      def quiz_todos
        quizzes = Quiz
          .where(course_id: enrolled_course_ids, status: "published")
          .order(:due_at, :id)

        latest_attempts = QuizAttempt
          .where(quiz_id: quizzes.select(:id), user_id: @student.id)
          .order(:attempt_number, :id)
          .group_by(&:quiz_id)
          .transform_values(&:last)

        quizzes.filter_map do |quiz|
          attempt = latest_attempts[quiz.id]
          next if attempt && %w[submitted graded].include?(attempt.status)

          {
            id: "quiz-#{quiz.id}",
            source_type: "quiz",
            source_id: quiz.id,
            title: quiz.title,
            due_at: quiz.due_at,
            status: attempt&.status || "not_started",
            course_id: quiz.course_id,
            priority: priority_for_due_at(quiz.due_at)
          }
        end
      end

      def goal_todos
        Goal.active.where(student_id: @student.id).order(:target_date, :id).map do |goal|
          {
            id: "goal-#{goal.id}",
            source_type: "goal",
            source_id: goal.id,
            title: goal.title,
            due_at: goal.target_date&.end_of_day,
            status: goal.status,
            course_id: nil,
            priority: goal.target_date.present? ? priority_for_due_at(goal.target_date.end_of_day) : "medium"
          }
        end
      end

      def enrolled_course_ids
        @enrolled_course_ids ||= Enrollment
          .joins(:section)
          .where(user_id: @student.id, role: "student")
          .distinct
          .pluck("sections.course_id")
      end

      def priority_for_due_at(due_at)
        return "medium" unless due_at

        due_time = due_at.to_time
        now = Time.current

        return "overdue" if due_time < now
        return "high" if due_time <= now + 2.days
        return "medium" if due_time <= now + 7.days

        "low"
      end
    end
  end
end
