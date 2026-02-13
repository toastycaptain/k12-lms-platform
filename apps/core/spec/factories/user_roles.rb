FactoryBot.define do
  factory :user_role do
    association :user
    association :role

    before(:create) do |user_role|
      user_role.tenant ||= user_role.user.tenant
    end
  end
end
