require "rails_helper"

RSpec.describe ApplicationRecord, type: :model do
  it "is an abstract class" do
    expect(ApplicationRecord).to be_abstract_class
  end
end
