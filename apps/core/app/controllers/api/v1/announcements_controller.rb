module Api
  module V1
    class AnnouncementsController < ApplicationController
      before_action :set_course_for_index, only: [ :index ]
      before_action :set_course_for_create, only: [ :create ]
      before_action :set_announcement, only: [ :update, :destroy ]

      def index
        announcements = policy_scope(Announcement).includes(:course, :created_by)
        announcements = announcements.where(course: @course) if @course
        announcements = announcements.pinned_first
        render json: announcements
      end

      def create
        unless @course
          return render json: { errors: [ "Course is required" ] }, status: :unprocessable_content
        end

        @announcement = @course.announcements.build(announcement_params.except(:course_id))
        @announcement.tenant = Current.tenant
        @announcement.created_by = Current.user
        authorize @announcement
        if @announcement.save
          NotificationService.notify_enrolled_students(
            course: @course,
            event_type: "announcement_posted",
            title: @announcement.title,
            message: @announcement.message.to_s.truncate(140),
            url: "/learn/courses/#{@course.id}/announcements",
            actor: Current.user,
            notifiable: @announcement,
            metadata: {
              title: @announcement.title,
              announcement_id: @announcement.id
            }
          )
          render json: @announcement, status: :created
        else
          render json: { errors: @announcement.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @announcement
        if @announcement.update(announcement_params)
          render json: @announcement
        else
          render json: { errors: @announcement.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @announcement
        @announcement.destroy!
        head :no_content
      end

      private

      def set_course_for_index
        return unless params[:course_id].present?

        @course = Course.find(params[:course_id])
      end

      def set_course_for_create
        course_id = params[:course_id] || announcement_params[:course_id]
        return if course_id.blank?

        @course = Course.find(course_id)
      end

      def set_announcement
        @announcement = Announcement.find(params[:id])
      end

      def announcement_params
        if params[:announcement].present?
          params.require(:announcement).permit(:title, :message, :published_at, :pinned, :course_id)
        else
          params.permit(:title, :message, :published_at, :pinned, :course_id)
        end
      end
    end
  end
end
