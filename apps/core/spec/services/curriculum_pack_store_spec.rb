require "rails_helper"

RSpec.describe CurriculumPackStore do
  let!(:tenant) { create(:tenant) }

  before do
    CurriculumProfileRegistry.reset!
    described_class.invalidate_cache!(tenant: tenant)
  end

  describe ".fetch" do
    it "prefers eligible tenant releases over system packs for the same key/version" do
      payload = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.1").deep_dup
      payload["terminology"]["subject_label"] = "Domain"

      release = CurriculumProfileRelease.create!(
        tenant: tenant,
        profile_key: "ib_continuum_v1",
        profile_version: "2026.1",
        status: "published",
        payload: payload,
        metadata: {}
      )
      described_class.invalidate_cache!(tenant: tenant)

      fetched = described_class.fetch(
        tenant: tenant,
        key: "ib_continuum_v1",
        version: "2026.1",
        with_metadata: true
      )

      expect(fetched).to be_present
      expect(fetched[:source]).to eq("tenant_release")
      expect(fetched[:release_id]).to eq(release.id)
      expect(fetched.dig(:payload, "terminology", "subject_label")).to eq("Domain")
      expect(fetched.dig(:capability_schema, :schema_version)).to eq("curriculum_pack_vnext.v1")
      expect(fetched.dig(:primitive_inventory, :shared)).to be_present
    end

    it "treats draft tenant releases as ineligible for exact key/version fetches" do
      payload = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.1").deep_dup

      CurriculumProfileRelease.create!(
        tenant: tenant,
        profile_key: "ib_continuum_v1",
        profile_version: "2026.1",
        status: "draft",
        payload: payload,
        metadata: {}
      )
      described_class.invalidate_cache!(tenant: tenant)

      fetched = described_class.fetch(
        tenant: tenant,
        key: "ib_continuum_v1",
        version: "2026.1",
        with_metadata: true
      )

      expect(fetched).to be_nil
    end
  end

  describe ".list" do
    it "includes tenant release rows and marks their source" do
      payload = CurriculumProfileRegistry.find("ib_continuum_v1", "2026.1").deep_dup
      CurriculumProfileRelease.create!(
        tenant: tenant,
        profile_key: "ib_continuum_v1",
        profile_version: "2026.1",
        status: "published",
        payload: payload,
        metadata: {}
      )
      described_class.invalidate_cache!(tenant: tenant)

      list = described_class.list(tenant: tenant)
      entry = list.find { |row| row[:key] == "ib_continuum_v1" && row[:version] == "2026.1" }

      expect(entry).to be_present
      expect(entry[:source]).to eq("tenant_release")
      expect(entry[:release_status]).to eq("published")
    end
  end
end
