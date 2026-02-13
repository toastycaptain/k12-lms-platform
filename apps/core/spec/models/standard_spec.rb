require "rails_helper"

RSpec.describe Standard, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:standard_framework) }
    it { should belong_to(:parent).class_name("Standard").optional }
    it { should have_many(:children).class_name("Standard").dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:code) }
    it { should validate_presence_of(:tenant_id) }
  end

  describe "tree structure" do
    let(:tenant) { create(:tenant) }

    before { Current.tenant = tenant }
    after { Current.tenant = nil }

    it "supports hierarchical nesting" do
      framework = create(:standard_framework, tenant: tenant)
      parent = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA")
      child1 = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA.1", parent: parent)
      child2 = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA.2", parent: parent)

      expect(parent.children).to contain_exactly(child1, child2)
      expect(child1.parent).to eq(parent)
    end

    it "returns roots scope" do
      framework = create(:standard_framework, tenant: tenant)
      root = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA")
      _child = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA.1", parent: root)

      expect(Standard.roots).to contain_exactly(root)
    end

    it "generates a tree hash" do
      framework = create(:standard_framework, tenant: tenant)
      root = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA", description: "Operations")
      child = create(:standard, tenant: tenant, standard_framework: framework, code: "1.OA.1", description: "Add", parent: root)

      tree = root.tree
      expect(tree[:code]).to eq("1.OA")
      expect(tree[:children].length).to eq(1)
      expect(tree[:children].first[:code]).to eq("1.OA.1")
    end
  end
end
