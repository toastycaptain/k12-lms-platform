FactoryBot.define do
  factory :role do
    association :tenant
    name { "teacher" }

    trait :admin do
      name { "admin" }
    end

    trait :curriculum_lead do
      name { "curriculum_lead" }
    end

    trait :teacher do
      name { "teacher" }
    end

    trait :student do
      name { "student" }
    end

    trait :guardian do
      name { "guardian" }
    end
  end
end
