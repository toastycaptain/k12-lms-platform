class SlowQueryService
  DEFAULT_LIMIT = 20

  class << self
    def top_queries(limit: DEFAULT_LIMIT)
      result = ActiveRecord::Base.connection.execute(<<~SQL)
        SELECT
          queryid,
          LEFT(query, 200) AS query_preview,
          calls,
          ROUND(total_exec_time::numeric, 2) AS total_time_ms,
          ROUND(mean_exec_time::numeric, 2) AS mean_time_ms,
          ROUND(max_exec_time::numeric, 2) AS max_time_ms,
          rows
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC
        LIMIT #{limit.to_i}
      SQL
      result.to_a
    rescue ActiveRecord::StatementInvalid => e
      Rails.logger.warn("[SlowQueryService] pg_stat_statements unavailable: #{e.message}")
      []
    end

    def reset!
      ActiveRecord::Base.connection.execute("SELECT pg_stat_statements_reset()")
    rescue ActiveRecord::StatementInvalid
      nil
    end
  end
end
