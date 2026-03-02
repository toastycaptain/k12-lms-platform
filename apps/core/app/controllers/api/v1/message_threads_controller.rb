module Api
  module V1
    class MessageThreadsController < ApplicationController
      before_action :set_message_thread, only: [ :show, :destroy ]

      def index
        threads = policy_scope(MessageThread)
          .includes(:course, { participants: :roles }, messages: { sender: :roles })
          .order(updated_at: :desc)
        threads = paginate(threads)

        render json: threads
      end

      def show
        authorize @message_thread
        render json: @message_thread, include_messages: true
      end

      def create
        authorize MessageThread, :create?

        course = course_for_create
        participant_ids = normalized_participant_ids
        participant_ids << Current.user.id unless participant_ids.include?(Current.user.id)

        unless participants_allowed_for_create?(participant_ids)
          return render json: { errors: [ "One or more participants are not allowed" ] }, status: :forbidden
        end

        users = User.where(id: participant_ids).to_a
        if users.length != participant_ids.length
          return render json: { errors: [ "One or more participants are invalid" ] }, status: :unprocessable_content
        end

        message_thread = MessageThread.new(message_thread_params)
        message_thread.tenant = Current.tenant
        message_thread.course = course if course

        ActiveRecord::Base.transaction do
          message_thread.save!

          users.each do |participant|
            message_thread.message_thread_participants.create!(
              tenant: Current.tenant,
              user: participant,
              last_read_at: participant.id == Current.user.id ? Time.current : nil
            )
          end
        end

        render json: message_thread, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: [ e.record.errors.full_messages ].flatten }, status: :unprocessable_content
      end

      def destroy
        authorize @message_thread

        participant = @message_thread.message_thread_participants.find_by(user: Current.user)
        participant&.destroy!

        head :no_content
      end

      private

      def set_message_thread
        @message_thread = MessageThread.includes(:course, { participants: :roles }, messages: { sender: :roles }).find(params[:id])
      end

      def message_thread_params
        params.permit(:subject, :thread_type)
      end

      def normalized_participant_ids
        Array(params[:participant_ids]).map(&:to_i).uniq
      end

      def course_for_create
        course_id = params[:course_id]
        return nil if course_id.blank?

        course = Course.find(course_id)
        authorize_course_for_create!(course)
        course
      end

      def participants_allowed_for_create?(participant_ids)
        return true unless Current.user.has_role?(:guardian)

        allowed_ids = policy_scope(User, policy_scope_class: UserPolicy::SearchScope).where(id: participant_ids).pluck(:id)
        (participant_ids - allowed_ids).empty?
      end

      def authorize_course_for_create!(course)
        return if guardian_can_reference_course?(course)
        return if CoursePolicy.new(Current.user, course).show?

        raise Pundit::NotAuthorizedError, "not allowed to attach this course"
      end

      def guardian_can_reference_course?(course)
        return false unless Current.user.has_role?(:guardian)

        linked_student_ids = GuardianLink.active.where(guardian_id: Current.user.id).select(:student_id)
        Enrollment.joins(:section)
          .where(user_id: linked_student_ids, role: "student", sections: { course_id: course.id })
          .exists?
      end
    end
  end
end
