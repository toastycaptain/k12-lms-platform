require "rails_helper"

RSpec.describe AlertEvaluationJob, type: :job do
  it "evaluates enabled alert configurations and triggers when threshold is met" do
    config = AlertConfiguration.create!(
      name: "Pool High",
      metric: "db_connection_pool",
      comparison: "gt",
      threshold: 0,
      severity: "warning",
      notification_channel: "slack",
      enabled: true,
      cooldown_minutes: 0
    )

    allow(SystemHealthService).to receive(:check_all).and_return(
      overall: "healthy",
      metrics: { db_connection_pool: 10.0 }
    )
    allow(SlackNotifier).to receive(:send_alert)

    described_class.perform_now

    expect(config.reload.trigger_count).to eq(1)
    expect(SlackNotifier).to have_received(:send_alert)
  end

  it "respects cooldown period" do
    config = AlertConfiguration.create!(
      name: "Pool High Cooldown",
      metric: "db_connection_pool",
      comparison: "gt",
      threshold: 0,
      severity: "warning",
      notification_channel: "slack",
      enabled: true,
      cooldown_minutes: 60,
      last_triggered_at: 5.minutes.ago,
      trigger_count: 1
    )

    allow(SystemHealthService).to receive(:check_all).and_return(
      overall: "healthy",
      metrics: { db_connection_pool: 10.0 }
    )
    allow(SlackNotifier).to receive(:send_alert)

    described_class.perform_now

    expect(config.reload.trigger_count).to eq(1)
    expect(SlackNotifier).not_to have_received(:send_alert)
  end
end
