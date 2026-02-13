require "rails_helper"

RSpec.describe Section, type: :model do
  describe "associations" do
    it { should belong_to(:tenant) }
    it { should belong_to(:course) }
    it { should belong_to(:term) }
    it { should have_many(:enrollments).dependent(:destroy) }
    it { should have_many(:users).through(:enrollments) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:tenant_id) }
  end
end
