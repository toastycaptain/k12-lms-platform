module Api
  module V1
    module Admin
      class SafetyController < ApplicationController
        VALID_LEVELS = %w[strict moderate standard].freeze

        before_action :authorize_admin

        def events
          authorize :safety, :view?

          events = AiInvocation.where(tenant: Current.tenant)
            .where("context->>'safety_event' IS NOT NULL")
            .order(created_at: :desc)
            .limit((params[:limit] || 100).to_i)
            .offset((params[:offset] || 0).to_i)

          render json: events.map { |invocation|
            safety_event = invocation.context["safety_event"] || {}
            {
              id: invocation.id,
              created_at: invocation.created_at,
              user_id: invocation.user_id,
              task_type: invocation.task_type,
              safety_category: safety_event["category"],
              safety_action: safety_event["action"],
              safety_detail: safety_event["detail"],
              confidence: safety_event["confidence"]
            }
          }
        end

        def stats
          authorize :safety, :view?

          period_days = (params[:days] || 30).to_i
          period_start = period_days.days.ago
          scope = AiInvocation.where(tenant: Current.tenant).where("created_at >= ?", period_start)

          total = scope.count
          blocked = scope.where("context->'safety_event'->>'action' = 'blocked'").count
          redacted = scope.where("context->'safety_event'->>'action' = 'redacted'").count
          categories = scope.where("context->>'safety_event' IS NOT NULL")
            .group("context->'safety_event'->>'category'")
            .count

          render json: {
            period_days: period_days,
            total_invocations: total,
            blocked_count: blocked,
            redacted_count: redacted,
            block_rate: total.positive? ? (blocked.to_f / total * 100).round(2) : 0,
            blocks_by_category: categories
          }
        end

        def show_config
          authorize :safety, :view?
          render json: {
            safety_level: current_safety_level
          }
        end

        def update_config
          authorize :safety, :manage?
          requested_level = params[:safety_level].to_s
          unless VALID_LEVELS.include?(requested_level)
            render json: { error: "Invalid safety_level. Valid: #{VALID_LEVELS.join(', ')}" }, status: :bad_request
            return
          end

          settings = (Current.tenant.settings || {}).deep_dup
          settings["ai_safety_level"] = requested_level
          Current.tenant.update!(settings: settings)

          render json: { safety_level: requested_level }
        end

        private

        def authorize_admin
          head :forbidden unless Current.user&.has_role?(:admin)
        end

        def current_safety_level
          Current.tenant.settings&.dig("ai_safety_level") || "strict"
        end
      end
    end
  end
end
