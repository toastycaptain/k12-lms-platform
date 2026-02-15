require "rails_helper"

RSpec.describe DiscussionPost, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:discussion) }
    it { should belong_to(:created_by).class_name("User") }
    it { should belong_to(:parent_post).optional }
    it { should have_many(:replies).class_name("DiscussionPost").with_foreign_key(:parent_post_id).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:content) }

    it "requires open discussion" do
      discussion = create(:discussion, tenant: tenant, status: "locked")
      post = build(:discussion_post, tenant: tenant, discussion: discussion)
      expect(post).not_to be_valid
      expect(post.errors.full_messages.join).to include("Cannot post")
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      p1 = create(:discussion_post, tenant: t1)
      Current.tenant = t2
      create(:discussion_post, tenant: t2)

      Current.tenant = t1
      expect(DiscussionPost.all).to contain_exactly(p1)
    end
  end
end
