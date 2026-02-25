module Api
  module V1
    class GuardianController < ApplicationController
      before_action :set_student, only: [ :grades, :assignments, :announcements ]

      # GET /api/v1/guardian/students
      def students
        authorize :guardian, :index?, policy_class: GuardianPolicy

        linked_student_ids = GuardianLink.active.where(guardian_id: Current.user.id).pluck(:student_id)
        students = User.where(id: linked_student_ids)
                       .includes(enrollments: { section: :course })
                       .order(:last_name, :first_name)

        render json: students, each_serializer: StudentSummarySerializer
      end

      # GET /api/v1/guardian/students/:id/grades
      def grades
        submissions = Submission.where(user_id: @student.id, assignment_id: assignment_scope.select(:id))
                                .includes(assignment: :course)
                                .order(graded_at: :desc)

        render json: submissions, each_serializer: GuardianGradeSerializer
      end

      # GET /api/v1/guardian/students/:id/assignments
      def assignments
        assignments = assignment_scope
                        .where("due_at >= ?", 30.days.ago)
                        .includes(:course)
                        .order(due_at: :asc)

        submissions_by_assignment = Submission.where(
          user_id: @student.id,
          assignment_id: assignments.select(:id)
        ).index_by(&:assignment_id)

        render json: assignments,
          each_serializer: GuardianAssignmentSerializer,
          submissions_by_assignment: submissions_by_assignment
      end

      # GET /api/v1/guardian/students/:id/announcements
      def announcements
        announcements = Announcement.where(course_id: course_ids)
                                    .order(created_at: :desc)
                                    .limit(20)

        render json: announcements
      end

      private

      def set_student
        @student = User.find(params[:id])
        authorize @student, :show?, policy_class: GuardianPolicy
      end

      def assignment_scope
        Assignment.where(course_id: course_ids)
      end

      def course_ids
        @course_ids ||= Enrollment.joins(:section)
                                  .where(user_id: @student.id, role: "student")
                                  .distinct
                                  .pluck("sections.course_id")
      end
    end
  end
end
