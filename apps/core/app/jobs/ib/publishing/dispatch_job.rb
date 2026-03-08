module Ib
  module Publishing
    class DispatchJob < ApplicationJob
      queue_as :ib_publishing
      retry_on StandardError, wait: 15.seconds, attempts: 3

      def perform(queue_item_id, actor_id = nil)
        queue_item = IbPublishingQueueItem.find(queue_item_id)
        actor = User.find_by(id: actor_id) || queue_item.created_by
        DispatchService.new(queue_item: queue_item, actor: actor).publish_now!
      end
    end
  end
end
