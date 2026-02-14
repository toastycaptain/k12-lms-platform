FactoryBot.define do
  factory :academic_year do
    association :tenant
    sequence(:name) { |n| "Academic Year #{n}" }
    start_date { Date.new(2026, 8, 1) }
    end_date { Date.new(2027, 6, 30) }
    current { false }
  end
end
