require "rails_helper"

RSpec.describe IbUserWorkspacePreference, type: :model, use_transactional_fixtures: false do
  let!(:tenant) { create(:tenant) }
  let!(:school) { create(:school, tenant: tenant) }
  let!(:user) do
    create(:user, tenant: tenant).tap do |created|
      created.add_role(:teacher)
    end
  end

  around do |example|
    Current.tenant = tenant
    example.run
  ensure
    Current.tenant = nil

    described_class.unscoped.where(tenant_id: tenant.id).delete_all
    UserRole.where(user_id: user.id).delete_all
    Role.where(tenant_id: tenant.id).delete_all
    School.where(id: school.id).delete_all
    User.where(id: user.id).delete_all
    Tenant.where(id: tenant.id).delete_all
  end

  describe ".write_value!" do
    it "keeps validation errors for invalid payloads" do
      expect do
        described_class.write_value!(
          user: user,
          school: school,
          surface: "",
          context_key: "visits",
          preference_key: "last_seen",
          programme: "Mixed",
          value: { last_seen_at: Time.current.utc.iso8601 }
        )
      end.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "atomically upserts concurrent writes for the same preference scope" do
      thread_count = 8
      ready = 0
      barrier_mutex = Mutex.new
      barrier = ConditionVariable.new
      errors = []
      timestamps = []
      results_mutex = Mutex.new

      threads = Array.new(thread_count) do |index|
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            timestamp = (Time.current + (index / 1000.0)).utc.iso8601(6)
            results_mutex.synchronize { timestamps << timestamp }

            barrier_mutex.synchronize do
              ready += 1
              barrier.broadcast if ready == thread_count
              barrier.wait(barrier_mutex) until ready == thread_count
            end

            described_class.write_value!(
              user: user,
              school: school,
              surface: "teacher_home",
              context_key: "visits",
              preference_key: "last_seen",
              programme: "Mixed",
              value: { last_seen_at: timestamp },
              metadata: { source: "concurrency_spec", writer: index }
            )
          end
        rescue StandardError => error
          results_mutex.synchronize { errors << error }
        end
      end

      threads.each(&:join)

      expect(errors).to be_empty

      records = described_class.unscoped.where(
        tenant_id: tenant.id,
        user_id: user.id,
        school_id: school.id,
        surface: "teacher_home",
        context_key: "visits",
        preference_key: "last_seen",
        scope_key: described_class.scope_key_for(user: user, school: school, programme: "Mixed")
      )

      expect(records.count).to eq(1)
      expect(timestamps).to include(records.first.value.fetch("last_seen_at"))
      expect(records.first.metadata).to include("source" => "concurrency_spec")
    end
  end
end
