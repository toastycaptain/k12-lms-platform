require "rails_helper"

RSpec.describe CurriculumProfileResolver do
  let!(:tenant) { create(:tenant, settings: tenant_settings) }
  let!(:academic_year) { create(:academic_year, tenant: tenant) }
  let!(:school) { create(:school, tenant: tenant, curriculum_profile_key: school_profile_key) }
  let!(:course) do
    create(
      :course,
      tenant: tenant,
      academic_year: academic_year,
      school: school,
      settings: course_settings
    )
  end

  let(:tenant_settings) { { "curriculum_default_profile_key" => "american_common_core_v1" } }
  let(:school_profile_key) { nil }
  let(:course_settings) { {} }

  before do
    CurriculumProfileRegistry.reset!
  end

  describe ".resolve" do
    it "uses course override before school and tenant defaults" do
      course.update!(settings: { "curriculum_profile_key" => "ib_continuum_v1", "curriculum_profile_version" => "2026.1" })
      school.update!(curriculum_profile_key: "british_cambridge_v1")
      tenant.update!(settings: { "curriculum_default_profile_key" => "american_common_core_v1" })

      resolved = described_class.resolve(tenant: tenant, school: school, course: course)

      expect(resolved[:profile_key]).to eq("ib_continuum_v1")
      expect(resolved[:source]).to eq("course")
      expect(resolved[:selected_from]).to eq("course_assignment")
      expect(resolved[:resolution_trace_id]).to be_present
      expect(resolved[:resolved_profile_version]).to eq("2026.1")
      expect(resolved[:document_types]).to be_a(Hash)
      expect(resolved[:document_schema_index]).to be_a(Hash)
    end

    it "uses school override when course override is absent" do
      school.update!(curriculum_profile_key: "british_cambridge_v1")
      course.update!(settings: {})

      resolved = described_class.resolve(tenant: tenant, school: school, course: course)

      expect(resolved[:profile_key]).to eq("british_cambridge_v1")
      expect(resolved[:source]).to eq("school")
      expect(resolved[:selected_from]).to eq("school_assignment")
    end

    it "uses tenant default when no course or school override exists" do
      tenant.update!(settings: { "curriculum_default_profile_key" => "singapore_moe_v1" })
      school.update!(curriculum_profile_key: nil)
      course.update!(settings: {})

      resolved = described_class.resolve(tenant: tenant, school: school, course: course)

      expect(resolved[:profile_key]).to eq("singapore_moe_v1")
      expect(resolved[:source]).to eq("tenant")
      expect(resolved[:selected_from]).to eq("tenant_assignment")
    end

    it "falls back to system profile when configured key is unknown" do
      tenant.update!(settings: { "curriculum_default_profile_key" => "unknown_profile" })
      school.update!(curriculum_profile_key: nil)
      course.update!(settings: {})

      resolved = described_class.resolve(tenant: tenant, school: school, course: course)

      expect(resolved[:profile_key]).to eq(CurriculumProfileRegistry.default_profile_key)
      expect(resolved[:source]).to eq("system")
      expect(resolved[:selected_from]).to eq("system_fallback")
      expect(resolved[:fallback_reason]).to be_present
    end

    it "uses tenant release payloads when curriculum_pack_store_v1 is enabled" do
      FeatureFlag.create!(key: "curriculum_pack_store_v1", enabled: true)
      tenant.update!(
        settings: {
          "curriculum_default_profile_key" => "ib_continuum_v1",
          "curriculum_default_profile_version" => "2026.1"
        }
      )

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

      resolved = described_class.resolve(tenant: tenant, school: school, course: course)

      expect(resolved[:profile_key]).to eq("ib_continuum_v1")
      expect(resolved.dig(:terminology, "subject_label")).to eq("Domain")
      expect(resolved[:pack_payload_source]).to eq("tenant_release")
      expect(resolved[:pack_release_id]).to eq(release.id)
      expect(resolved.dig(:framework_bindings, "defaults")).to be_an(Array)
    end
  end
end
