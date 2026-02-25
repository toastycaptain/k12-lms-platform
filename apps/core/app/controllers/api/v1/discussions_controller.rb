module Api
  module V1
    class DiscussionsController < ApplicationController
      before_action :set_course, only: [ :index, :create ]
      before_action :set_discussion, only: [ :show, :update, :destroy, :lock, :unlock ]

      def index
        discussions = policy_scope(Discussion).where(course: @course).includes(:discussion_posts, :created_by).order(:created_at)
        render json: discussions
      end

      def show
        authorize @discussion
        render json: @discussion
      end

      def create
        @discussion = @course.discussions.build(discussion_params)
        @discussion.tenant = Current.tenant
        @discussion.created_by = Current.user
        authorize @discussion
        if @discussion.save
          render json: @discussion, status: :created
        else
          render json: { errors: @discussion.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @discussion
        if @discussion.update(discussion_params)
          render json: @discussion
        else
          render json: { errors: @discussion.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @discussion
        @discussion.destroy!
        head :no_content
      end

      def lock
        authorize @discussion, :lock?
        if @discussion.update(status: "locked")
          render json: @discussion
        else
          render json: { errors: @discussion.errors.full_messages }, status: :unprocessable_content
        end
      end

      def unlock
        authorize @discussion, :lock?
        if @discussion.update(status: "open")
          render json: @discussion
        else
          render json: { errors: @discussion.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def set_course
        @course = Course.find(params[:course_id])
      end

      def set_discussion
        @discussion = Discussion.includes(:discussion_posts, :created_by).find(params[:id])
      end

      def discussion_params
        params.permit(:title, :description, :status, :pinned, :require_initial_post)
      end
    end
  end
end
