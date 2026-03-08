module Ib
  module Publishing
    class DispatchService
      def initialize(queue_item:, actor:)
        @queue_item = queue_item
        @actor = actor
      end

      def schedule!(scheduled_for:)
        queue_item.with_lock do
          return queue_item if queue_item.state == "scheduled" && queue_item.scheduled_for.to_i == scheduled_for.to_time.to_i

          update_queue_item!(
            state: "scheduled",
            scheduled_for: scheduled_for,
            metadata: queue_item.metadata.merge("last_notification_event" => "scheduled")
          )
        end
      end

      def hold!(reason:)
        queue_item.with_lock do
          return queue_item if queue_item.state == "held" && queue_item.held_reason.to_s == reason.to_s

          update_queue_item!(
            state: "held",
            held_reason: reason,
            metadata: queue_item.metadata.merge("last_notification_event" => "held")
          )
        end
      end

      def publish_now!
        queue_item.with_lock do
          return queue_item if queue_item.state == "published" && queue_item.delivered_at.present?

          idempotency_key = digest_key
          return queue_item if queue_item.metadata["last_publish_token"] == idempotency_key

          update_queue_item!(
            state: "published",
            delivered_at: Time.current,
            metadata: queue_item.metadata.merge(
              "last_publish_token" => idempotency_key,
              "last_notification_event" => "publish_succeeded",
              "publishing_contract" => Curriculum::PublishingCapability.contract_for(pack: current_pack_payload)
            )
          )
          queue_item.ib_learning_story.update!(state: "published", published_at: Time.current)
        end
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

      def self.enqueue_publish!(queue_item:, actor:)
        job = DispatchJob.perform_later(queue_item.id, actor&.id)
        ::Ib::Support::OperationalJobTracker.register_enqueue!(
          job: job,
          operation_key: "publishing_dispatch",
          tenant: queue_item.tenant,
          school: queue_item.school,
          actor: actor,
          source_record: queue_item,
          payload: {
            queue_item_id: queue_item.id,
            learning_story_id: queue_item.ib_learning_story_id
          },
          idempotency_key: queue_item.metadata["last_publish_token"] || "#{queue_item.id}:#{queue_item.updated_at.to_i}"
        )
        job
      end

      private

      attr_reader :queue_item, :actor

      def update_queue_item!(attributes)
        queue_item.update!(attributes)
        queue_item
      end

      def digest_key
        [
          queue_item.id,
          queue_item.state,
          queue_item.scheduled_for&.to_i,
          queue_item.ib_learning_story_id,
          queue_item.ib_learning_story.updated_at.to_i
        ].join(":")
      end

      def current_pack_payload
        @current_pack_payload ||= CurriculumPackStore.fetch(
          tenant: queue_item.tenant,
          key: Ib::Governance::RolloutConsoleService::PACK_KEY,
          version: Ib::Governance::RolloutConsoleService::CURRENT_PACK_VERSION
        ) || {}
      end
    end
  end
end
