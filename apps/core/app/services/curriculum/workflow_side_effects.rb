module Curriculum
  class WorkflowSideEffects
    SideEffectError = Class.new(StandardError)

    class << self
      def apply!(effects:, record:, actor:, context: {})
        Array(effects).each do |effect|
          effect_payload = stringify_keys(effect || {})
          type = effect_payload["type"].to_s
          handler = registry[type]
          raise SideEffectError, "Unknown side effect #{type}" if handler.nil?

          handler.call(record: record, actor: actor, context: context, params: effect_payload)
        end

        true
      end

      private

      def registry
        @registry ||= {
          "create_approval" => lambda { |record:, actor:, **|
            return unless record.respond_to?(:approvals)

            record.approvals.create!(
              tenant: record.tenant,
              requested_by: actor,
              status: "pending"
            )
          },
          "auto_approve_pending" => lambda { |record:, **|
            Approval.where(approvable: record, status: "pending").update_all(status: "approved", updated_at: Time.current)
          },
          "notify_roles" => lambda { |record:, actor:, params:, **|
            roles = Array(params["roles"]).map(&:to_s)
            return if roles.empty?

            scope = User.unscoped.where(tenant_id: record.tenant_id).joins(:roles).where(roles: { name: roles }).distinct
            scope.find_each do |user|
              next if actor && user.id == actor.id

              NotificationService.notify(
                user: user,
                event_type: "workflow_transition",
                title: "#{record.class.name.titleize} updated",
                message: "#{record.class.name.titleize} transitioned to #{record.status}",
                url: params["url"].presence || "/plan",
                actor: actor,
                notifiable: record,
                metadata: {
                  record_type: record.class.name,
                  record_id: record.id,
                  status: record.status
                }
              )
            end
          }
        }
      end

      def stringify_keys(value)
        case value
        when Hash
          value.each_with_object({}) do |(key, item), memo|
            memo[key.to_s] = stringify_keys(item)
          end
        when Array
          value.map { |item| stringify_keys(item) }
        else
          value
        end
      end
    end
  end
end
