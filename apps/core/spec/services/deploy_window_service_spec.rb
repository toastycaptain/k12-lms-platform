require "rails_helper"

RSpec.describe DeployWindowService do
  describe ".allowed_now?" do
    it "blocks weekday school hours" do
      time = Time.zone.parse("2026-02-24 10:00:00") # Tuesday
      expect(described_class.allowed_now?(time)).to be(false)
    end

    it "allows weekday after school hours" do
      time = Time.zone.parse("2026-02-24 18:30:00")
      expect(described_class.allowed_now?(time)).to be(true)
    end
  end

  describe ".current_status" do
    it "returns wait time when blocked" do
      time = Time.zone.parse("2026-02-24 09:15:00")
      status = described_class.current_status(time)

      expect(status[:allowed]).to be(false)
      expect(status[:next_safe_window]).to be_present
      expect(status[:wait_minutes]).to be > 0
    end
  end
end
