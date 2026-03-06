module Api
  module V1
    module Ib
      class PublishingQueueItemsController < BaseController
        before_action :set_queue_item, only: [ :update, :schedule, :hold, :publish ]

        def index
          authorize IbPublishingQueueItem
          items = policy_scope(IbPublishingQueueItem).includes(:ib_learning_story).order(updated_at: :desc)
          items = items.where(state: params[:state]) if params[:state].present?
          render json: items
        end

        def create
          authorize IbPublishingQueueItem
          story = policy_scope(IbLearningStory).find(queue_item_params.fetch(:ib_learning_story_id))
          item = IbPublishingQueueItem.create!(queue_item_params.merge(
            tenant: Current.tenant,
            school: story.school,
            created_by: Current.user
          ))
          audit!(item, "created")
          render json: item, status: :created
        end

        def update
          authorize @queue_item
          @queue_item.update!(queue_item_update_params)
          audit!(@queue_item, "updated")
          render json: @queue_item
        end

        def schedule
          authorize @queue_item
          ::Ib::Publishing::DispatchService.new(queue_item: @queue_item, actor: Current.user).schedule!(
            scheduled_for: params[:scheduled_for]
          )
          ::Ib::Support::Telemetry.emit(
            event: "ib.publishing.scheduled",
            tenant: Current.tenant,
            user: Current.user,
            school: @queue_item.school,
            metadata: { queue_item_id: @queue_item.id, state: @queue_item.state }
          )
          audit!(@queue_item, "scheduled")
          render json: @queue_item
        end

        def hold
          authorize @queue_item
          ::Ib::Publishing::DispatchService.new(queue_item: @queue_item, actor: Current.user).hold!(
            reason: params[:held_reason]
          )
          ::Ib::Support::Telemetry.emit(
            event: "ib.publishing.held",
            tenant: Current.tenant,
            user: Current.user,
            school: @queue_item.school,
            metadata: { queue_item_id: @queue_item.id, state: @queue_item.state }
          )
          audit!(@queue_item, "held")
          render json: @queue_item
        end

        def publish
          authorize @queue_item
          ::Ib::Publishing::DispatchService.new(queue_item: @queue_item, actor: Current.user).publish_now!
          ::Ib::Support::Telemetry.emit(
            event: "ib.publishing.published",
            tenant: Current.tenant,
            user: Current.user,
            school: @queue_item.school,
            metadata: { queue_item_id: @queue_item.id, state: @queue_item.state }
          )
          audit!(@queue_item, "publish_succeeded")
          render json: @queue_item
        rescue StandardError => e
          audit!(@queue_item, "publish_failed", message: e.message)
          render json: { errors: [ e.message ] }, status: :unprocessable_content
        end

        private

        def set_queue_item
          @queue_item = policy_scope(IbPublishingQueueItem).find(params[:id])
        end

        def queue_item_params
          params.require(:ib_publishing_queue_item).permit(:ib_learning_story_id, :state, :scheduled_for, :held_reason, metadata: {})
        end

        def queue_item_update_params
          params.require(:ib_publishing_queue_item).permit(:state, :scheduled_for, :held_reason, metadata: {})
        end

        def audit!(queue_item, event_type, message: nil)
          IbPublishingAudit.create!(
            tenant: Current.tenant,
            school: queue_item.school,
            ib_learning_story: queue_item.ib_learning_story,
            ib_publishing_queue_item: queue_item,
            changed_by: Current.user,
            event_type: event_type,
            details: {
              state: queue_item.state,
              scheduled_for: queue_item.scheduled_for,
              held_reason: queue_item.held_reason,
              message: message
            }
          )
        end
      end
    end
  end
end
