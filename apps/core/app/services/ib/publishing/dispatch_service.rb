module Ib
  module Publishing
    class DispatchService
      def initialize(queue_item:, actor:)
        @queue_item = queue_item
        @actor = actor
      end

      def schedule!(scheduled_for:)
        return queue_item if queue_item.state == "scheduled" && queue_item.scheduled_for.to_i == scheduled_for.to_time.to_i

        update_queue_item!(
          state: "scheduled",
          scheduled_for: scheduled_for,
          metadata: queue_item.metadata.merge("last_notification_event" => "scheduled")
        )
      end

      def hold!(reason:)
        return queue_item if queue_item.state == "held" && queue_item.held_reason.to_s == reason.to_s

        update_queue_item!(
          state: "held",
          held_reason: reason,
          metadata: queue_item.metadata.merge("last_notification_event" => "held")
        )
      end

      def publish_now!
        return queue_item if queue_item.state == "published" && queue_item.delivered_at.present?

        idempotency_key = digest_key
        return queue_item if queue_item.metadata["last_publish_token"] == idempotency_key

        update_queue_item!(
          state: "published",
          delivered_at: Time.current,
          metadata: queue_item.metadata.merge(
            "last_publish_token" => idempotency_key,
            "last_notification_event" => "publish_succeeded"
          )
        )
        queue_item.ib_learning_story.update!(state: "published", published_at: Time.current)
        queue_item
      rescue StandardError => e
        queue_item.audits.create!(
          tenant: queue_item.tenant,
          school: queue_item.school,
          ib_learning_story: queue_item.ib_learning_story,
          changed_by: actor,
          event_type: "publish_failed",
          details: { message: e.message }
        )
        raise
      end

      private

      attr_reader :queue_item, :actor

      def update_queue_item!(attributes)
        queue_item.update!(attributes)
        queue_item
      end

      def digest_key
        "#{queue_item.id}-#{queue_item.updated_at.to_i}-#{queue_item.ib_learning_story.updated_at.to_i}"
      end
    end
  end
end
