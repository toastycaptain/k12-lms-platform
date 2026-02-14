require "rails_helper"

RSpec.describe QtiExportJob do
  let(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:bank) do
    Current.tenant = tenant
    b = create(:question_bank, tenant: tenant, created_by: teacher)
    Current.tenant = nil
    b
  end

  before do
    Current.tenant = tenant
    create(:question, tenant: tenant, question_bank: bank, created_by: teacher,
           question_type: "multiple_choice",
           prompt: "What is 2+2?",
           choices: [ { "key" => "a", "text" => "3" }, { "key" => "b", "text" => "4" } ],
           correct_answer: { "key" => "b" })
    create(:question, :true_false, tenant: tenant, question_bank: bank, created_by: teacher,
           prompt: "The sky is blue")
    Current.tenant = nil
  end

  after { Current.tenant = nil }

  it "generates QTI XML and attaches it" do
    described_class.perform_now(bank.id)

    bank.reload
    expect(bank.qti_export).to be_attached
    expect(bank.qti_export.content_type).to eq("application/xml")

    xml = bank.qti_export.download
    doc = Nokogiri::XML(xml)
    doc.remove_namespaces!
    items = doc.xpath("//item")
    expect(items.length).to eq(2)
  end
end
