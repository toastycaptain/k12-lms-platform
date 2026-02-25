require "rails_helper"

RSpec.describe RefreshAnalyticsViewsJob, type: :job do
  subject(:job) { described_class.new }

  let(:connection) { instance_double(ActiveRecord::ConnectionAdapters::PostgreSQLAdapter) }

  it "is enqueued in the low queue" do
    expect(job.queue_name).to eq("low")
  end

  it "refreshes each materialized view when present" do
    allow(ActiveRecord::Base).to receive(:connection).and_return(connection)
    allow(connection).to receive(:select_value).and_return("m")
    allow(connection).to receive(:quote).and_return("'tenant_daily_stats'", "'course_engagement_stats'")
    allow(connection).to receive(:quote_table_name).and_return('"tenant_daily_stats"', '"course_engagement_stats"')
    allow(connection).to receive(:execute)

    expect { job.perform }.not_to raise_error
    expect(connection).to have_received(:execute).with('REFRESH MATERIALIZED VIEW CONCURRENTLY "tenant_daily_stats"')
    expect(connection).to have_received(:execute).with('REFRESH MATERIALIZED VIEW CONCURRENTLY "course_engagement_stats"')
  end

  it "skips refresh when the view is not materialized" do
    allow(ActiveRecord::Base).to receive(:connection).and_return(connection)
    allow(connection).to receive(:select_value).and_return(nil)
    allow(connection).to receive(:quote).and_return("'tenant_daily_stats'", "'course_engagement_stats'")

    expect(connection).not_to receive(:execute)
    expect { job.perform }.not_to raise_error
  end
end
