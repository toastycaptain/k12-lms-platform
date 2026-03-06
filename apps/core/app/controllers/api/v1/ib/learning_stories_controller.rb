module Api
  module V1
    module Ib
      class LearningStoriesController < BaseController
        before_action :set_story, only: [ :show, :update ]

        def index
          authorize IbLearningStory
          stories = policy_scope(IbLearningStory).includes(:blocks, :evidence_items).order(updated_at: :desc)
          stories = stories.where(programme: params[:programme]) if params[:programme].present?
          stories = stories.where(curriculum_document_id: params[:curriculum_document_id]) if params[:curriculum_document_id].present?
          render json: stories
        end

        def show
          authorize @story
          render json: @story
        end

        def create
          authorize IbLearningStory
          story = IbLearningStory.create!(story_params.merge(
            tenant: Current.tenant,
            school_id: current_school_scope&.id || story_params.fetch(:school_id),
            created_by: Current.user
          ))
          sync_blocks!(story)
          render json: story, status: :created
        end

        def update
          authorize @story
          @story.update!(story_params)
          sync_blocks!(@story)
          render json: @story
        end

        private

        def set_story
          @story = policy_scope(IbLearningStory).find(params[:id])
        end

        def story_params
          params.require(:ib_learning_story).permit(
            :school_id,
            :planning_context_id,
            :curriculum_document_id,
            :programme,
            :state,
            :cadence,
            :audience,
            :title,
            :summary,
            :support_prompt,
            :published_at,
            metadata: {}
          )
        end

        def sync_blocks!(story)
          return unless params[:ib_learning_story][:blocks].is_a?(Array)

          story.blocks.destroy_all
          params[:ib_learning_story][:blocks].each_with_index do |block, index|
            story.blocks.create!(
              tenant: Current.tenant,
              position: index,
              block_type: block[:block_type] || "narrative",
              content: block[:content].to_s,
              metadata: block[:metadata] || {}
            )
          end
        end
      end
    end
  end
end
