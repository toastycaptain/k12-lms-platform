require "rails_helper"

RSpec.describe SlowQueryService do
  describe ".top_queries" do
    let(:result) do
      [
        {
          "queryid" => 1234,
          "query_preview" => "SELECT * FROM assignments",
          "calls" => 10,
          "total_time_ms" => 50.0,
          "mean_time_ms" => 5.0,
          "max_time_ms" => 9.5,
          "rows" => 42
        }
      ]
    end

    it "returns an array from pg_stat_statements" do
      allow(ActiveRecord::Base.connection).to receive(:execute).and_return(result)

      expect(described_class.top_queries(limit: 5)).to eq(result)
    end

    it "returns an empty array when pg_stat_statements is unavailable" do
      allow(ActiveRecord::Base.connection).to receive(:execute)
        .and_raise(ActiveRecord::StatementInvalid, "extension not found")

      expect(described_class.top_queries).to eq([])
    end
  end

  describe ".reset!" do
    it "returns nil when reset is unavailable" do
      allow(ActiveRecord::Base.connection).to receive(:execute)
        .and_raise(ActiveRecord::StatementInvalid, "extension not found")

      expect(described_class.reset!).to be_nil
    end
  end
end
