module Ib
  module Search
    class FreshnessService
      def initialize(tenant:, school: nil)
        @tenant = tenant
        @school = school
      end

      def payload
        {
          index_strategy: "database_scoped_search_v3",
          freshness_target_minutes: 5,
          latency_budget_ms: latency_budget_ms,
          backpressure_strategy: backlog_level,
          rebuild_controls: {
            mode: "manual_request_plus_background_refresh",
            large_school_profile_count: active_profiles.count,
            search_queue_backlog: recent_query_count,
            recommend_full_rebuild: recent_zero_result_rate > 0.35
          },
          adoption_window_days: 14
        }
      end

      private

      attr_reader :tenant, :school

      def active_profiles
        scope = IbSearchProfile.where(tenant_id: tenant.id, status: "active")
        scope = scope.where(school_id: [ school&.id, nil ].compact) if school
        scope
      end

      def latency_budget_ms
        active_profiles.minimum(:latency_budget_ms) || 800
      end

      def recent_query_count
        activity_scope.where(event_name: %w[ib.search.executed ib.search.zero_result]).count
      end

      def recent_zero_result_rate
        searches = recent_query_count
        return 0.0 if searches.zero?

        activity_scope.where(event_name: "ib.search.zero_result").count.to_f / searches
      end

      def backlog_level
        return "rebuild" if recent_zero_result_rate > 0.35
        return "steady" if recent_query_count < 25

        "throttle_and_rank"
      end

      def activity_scope
        scope = IbActivityEvent.where(tenant_id: tenant.id).where("occurred_at >= ?", 14.days.ago)
        scope = scope.where(school_id: school.id) if school
        scope
      end
    end
  end
end
