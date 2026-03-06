module Curriculum
  class WorkflowGuards
    GuardFailed = Class.new(StandardError)

    class << self
      def check!(guards:, record:, actor:, context: {})
        Array(guards).each do |guard|
          guard_payload = stringify_keys(guard || {})
          type = guard_payload["type"].to_s
          handler = registry[type]
          raise GuardFailed, "Unknown guard #{type}" if handler.nil?

          passed = handler.call(record: record, actor: actor, context: context, params: guard_payload)
          raise GuardFailed, "Guard failed: #{type}" unless passed
        end

        true
      end

      private

      def registry
        @registry ||= {
          "approval_required" => lambda { |_kwargs|
            _kwargs[:context][:approval_required] == true
          },
          "approval_not_required_or_approved" => lambda { |record:, context:, **|
            return true unless context[:approval_required] == true
            return true if record.status.to_s == "pending_approval"

            Approval.where(approvable: record, status: "approved").exists?
          },
          "has_current_version" => lambda { |record:, **|
            return true unless record.respond_to?(:current_version)

            record.current_version.present?
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
