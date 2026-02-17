if Rails.env.development?
  ActiveSupport::Notifications.subscribe("sql.active_record") do |_name, start, finish, _id, payload|
    duration = (finish - start) * 1000
    next if duration <= 100
    next if payload[:cached]

    Rails.logger.warn("SLOW QUERY (#{duration.round(1)}ms): #{payload[:sql]}")
  end
end
