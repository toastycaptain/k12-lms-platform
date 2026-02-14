module Api
  module V1
    class AnnouncementsController < ApplicationController
      before_action :set_course, only: [ :index, :create ]
      before_action :set_announcement, only: [ :update, :destroy ]

      def index
        announcements = policy_scope(Announcement).where(course: @course).pinned_first
        render json: announcements
      end

      def create
        @announcement = @course.announcements.build(announcement_params)
        @announcement.tenant = Current.tenant
        @announcement.created_by = Current.user
        authorize @announcement
        if @announcement.save
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

      def set_course
        @course = Course.find(params[:course_id])
      end

      def set_announcement
        @announcement = Announcement.find(params[:id])
      end

      def announcement_params
        params.permit(:title, :message, :published_at, :pinned)
      end
    end
  end
end
