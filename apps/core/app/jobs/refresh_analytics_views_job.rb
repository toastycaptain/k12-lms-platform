class RefreshAnalyticsViewsJob < ApplicationJob
  queue_as :low

  VIEWS = %w[tenant_daily_stats course_engagement_stats].freeze

  def perform
    VIEWS.each { |view| refresh_view(view) }
  end

  private

  def refresh_view(view_name)
    return unless materialized_view?(view_name)

    connection.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY #{connection.quote_table_name(view_name)}")
    Rails.logger.info("[Analytics] Refreshed materialized view: #{view_name}")
  rescue ActiveRecord::StatementInvalid => e
    Rails.logger.warn("[Analytics] Failed to refresh materialized view #{view_name}: #{e.message}")
  end

  def materialized_view?(view_name)
    connection.select_value(<<~SQL.squish) == "m"
      SELECT c.relkind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = ANY(current_schemas(false))
        AND c.relname = #{connection.quote(view_name)}
    SQL
  end

  def connection
    ActiveRecord::Base.connection
  end
end
