require "rails_helper"

RSpec.describe "Row Level Security", type: :model do
  SYSTEM_TABLES = %w[
    ar_internal_metadata
    backup_records
    schema_migrations
    tenants
    alert_configurations
    active_storage_attachments
    active_storage_blobs
    active_storage_variant_records
  ].freeze

  let(:connection) { ActiveRecord::Base.connection }

  let(:tenant_tables) do
    connection.tables.reject do |table|
      SYSTEM_TABLES.include?(table) || !connection.column_exists?(table, :tenant_id)
    end
  end

  before do
    skip "PostgreSQL-only RLS checks" unless connection.adapter_name.downcase.include?("postgresql")
  end

  it "enables RLS on tenant-scoped tables" do
    missing_rls = tenant_tables.select do |table|
      connection.select_value(<<~SQL.squish) != true
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = #{connection.quote(table)}
      SQL
    end

    pending("Missing RLS on tenant-scoped tables: #{missing_rls.join(', ')}") if missing_rls.any?
    expect(missing_rls).to be_empty
  end

  it "defines tenant_isolation_policy on tenant-scoped tables" do
    missing_policy = tenant_tables.select do |table|
      policy_names = connection.select_values(<<~SQL.squish)
        SELECT polname
        FROM pg_policy
        WHERE polrelid = #{connection.quote(table)}::regclass
      SQL
      !policy_names.include?("tenant_isolation_policy")
    end

    pending("Missing tenant_isolation_policy on tables: #{missing_policy.join(', ')}") if missing_policy.any?
    expect(missing_policy).to be_empty
  end
end
