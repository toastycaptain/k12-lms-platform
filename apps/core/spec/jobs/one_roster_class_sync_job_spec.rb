require "rails_helper"

RSpec.describe OneRosterClassSyncJob, type: :job do
  let!(:tenant) { create(:tenant) }
  let(:admin) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:admin)
    u
  end
  let(:config) do
    create(:integration_config, :oneroster, tenant: tenant, created_by: admin)
  end
  let(:mock_client) { instance_double(OneRosterClient) }
  let!(:academic_year) do
    create(:academic_year, tenant: tenant)
  end

  before do
    Current.tenant = tenant
    allow(OneRosterClient).to receive(:new).and_return(mock_client)
  end

  after { Current.tenant = nil }

  describe "#perform" do
    it "creates Course records from OneRoster classes" do
      allow(mock_client).to receive(:get_all_classes).and_return([
        {
          "sourcedId" => "c-1",
          "title" => "Math 101",
          "classCode" => "MATH101",
          "subjects" => [ "Mathematics" ]
        }
      ])

      expect {
        described_class.new.perform(config.id, admin.id)
      }.to change(Course, :count).by(1)

      course = Course.find_by(name: "Math 101")
      expect(course.code).to eq("MATH101")
      mapping = SyncMapping.find_external(config, "oneroster_class", "c-1")
      expect(mapping.local_id).to eq(course.id)
    end

    it "updates existing course when SyncMapping exists" do
      course = create(:course, tenant: tenant, name: "Old Name", academic_year: academic_year)
      SyncMapping.create!(
        tenant: tenant, integration_config: config,
        local_type: "Course", local_id: course.id,
        external_id: "c-1", external_type: "oneroster_class"
      )

      allow(mock_client).to receive(:get_all_classes).and_return([
        {
          "sourcedId" => "c-1",
          "title" => "New Name",
          "classCode" => "NEW101"
        }
      ])

      described_class.new.perform(config.id, admin.id)

      expect(course.reload.name).to eq("New Name")
      expect(course.code).to eq("NEW101")
    end

    it "creates a completed SyncRun" do
      allow(mock_client).to receive(:get_all_classes).and_return([])

      described_class.new.perform(config.id, admin.id)

      sync_run = SyncRun.last
      expect(sync_run.sync_type).to eq("oneroster_class_sync")
      expect(sync_run.status).to eq("completed")
    end
  end
end
