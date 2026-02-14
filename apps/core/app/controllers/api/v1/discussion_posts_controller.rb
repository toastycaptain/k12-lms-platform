module Api
  module V1
    class DiscussionPostsController < ApplicationController
      before_action :set_discussion, only: [ :index, :create ]
      before_action :set_post, only: [ :destroy ]

      def index
        posts = policy_scope(DiscussionPost).where(discussion: @discussion)
        render json: posts
      end

      def create
        @post = @discussion.discussion_posts.build(post_params)
        @post.tenant = Current.tenant
        @post.created_by = Current.user
        authorize @post
        if @post.save
          render json: @post, status: :created
        else
          render json: { errors: @post.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @post
        @post.destroy!
        head :no_content
      end

      private

      def set_discussion
        @discussion = Discussion.find(params[:discussion_id])
      end

      def set_post
        @post = DiscussionPost.find(params[:id])
      end

      def post_params
        params.permit(:content, :parent_post_id)
      end
    end
  end
end
