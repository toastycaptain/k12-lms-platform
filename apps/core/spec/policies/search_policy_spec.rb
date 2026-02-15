require "rails_helper"

RSpec.describe SearchPolicy, type: :policy do
  subject(:policy) { described_class }

  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  permissions :index? do
    it "permits authenticated users" do
      expect(policy).to permit(user, :search)
    end
  end
end
