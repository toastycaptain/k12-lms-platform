require "rails_helper"

RSpec.describe TemplatePushService do
  let(:district) { create(:district) }
  let(:source_tenant) { create(:tenant, district: district, name: "North School") }
  let(:target_tenant) { create(:tenant, district: district, name: "South School") }
  let(:source_user) { create(:user, tenant: source_tenant) }
  let(:target_user) { create(:user, tenant: target_tenant) }

  let(:source_template) do
    Current.tenant = source_tenant
    framework = create(:standard_framework, tenant: source_tenant, name: "Math Framework")
    standard = create(:standard, tenant: source_tenant, standard_framework: framework, code: "MATH.1", grade_band: "3-5")
    template = create(
      :template,
      tenant: source_tenant,
      created_by: source_user,
      name: "Fractions Unit",
      status: "draft"
    )
    version = template.create_version!(
      title: "Fractions Unit v1",
      description: "Intro to fractions",
      essential_questions: [ "What is a fraction?" ],
      enduring_understandings: [ "Fractions represent equal parts." ],
      suggested_duration_weeks: 2
    )
    create(:template_version_standard, tenant: source_tenant, template_version: version, standard: standard)
    template.publish!
    template
  end

  before do
    target_user
    Current.tenant = target_tenant
    framework = create(:standard_framework, tenant: target_tenant, name: "Math Framework")
    create(:standard, tenant: target_tenant, standard_framework: framework, code: "MATH.1", grade_band: "3-5")
    Current.tenant = source_tenant
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "copies template content and aligned standards to the target tenant" do
    pushed = described_class.new(source_template, target_tenant, actor: source_user).call

    Current.tenant = target_tenant
    expect(pushed.tenant_id).to eq(target_tenant.id)
    expect(pushed.name).to eq("Fractions Unit")
    expect(pushed.status).to eq("published")
    expect(pushed.template_versions.count).to eq(1)
    expect(pushed.current_version).to be_present
    expect(pushed.current_version.title).to eq("Fractions Unit v1")
    expect(pushed.current_version.standards.pluck(:code)).to eq([ "MATH.1" ])
  end

  it "restores Current.tenant after completion" do
    previous_tenant = Current.tenant

    described_class.new(source_template, target_tenant, actor: source_user).call

    expect(Current.tenant).to eq(previous_tenant)
  end
end
