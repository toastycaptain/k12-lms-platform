module Api
  module V1
    class GradebookController < ApplicationController
      def show
        @course = Course.find(params[:id])
        authorize @course, :show?

        enrollments = Enrollment.where(section: @course.sections)
        student_ids = enrollments.where(role: "student").pluck(:user_id).uniq
        assignment_ids = @course.assignments.pluck(:id)

        submissions = Submission.where(assignment_id: assignment_ids, user_id: student_ids)

        gradebook = submissions.map do |s|
          { user_id: s.user_id, assignment_id: s.assignment_id, grade: s.grade, status: s.status }
        end

        render json: gradebook
      end
    end
  end
end
