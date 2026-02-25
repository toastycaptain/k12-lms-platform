require "rails_helper"

RSpec.describe "Schema consistency" do
  it "has no pending migrations" do
    expect(ActiveRecord::Base.connection_pool.migration_context).not_to be_needs_migration
  end

  it "has unique migration timestamps" do
    migration_files = Dir[Rails.root.join("db/migrate/*.rb")]
    timestamps = migration_files.map { |file| File.basename(file).split("_").first }
    duplicates = timestamps.tally.select { |_timestamp, count| count > 1 }.keys

    expect(duplicates).to be_empty, "Duplicate migration timestamps: #{duplicates.join(', ')}"
  end
end
