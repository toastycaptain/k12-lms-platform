FactoryBot.define do
  factory :planning_context do
    association :tenant
    school { association(:school, tenant: tenant) }
    academic_year { association(:academic_year, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    kind { "course" }
    sequence(:name) { |n| "Planning Context #{n}" }
    status { "active" }
    settings { {} }
    metadata { {} }
  end
end
