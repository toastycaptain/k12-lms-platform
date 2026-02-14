FactoryBot.define do
  factory :term do
    association :tenant
    association :academic_year
    sequence(:name) { |n| "Term #{n}" }
    start_date { Date.new(2026, 8, 1) }
    end_date { Date.new(2026, 12, 20) }
  end
end
