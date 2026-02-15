FactoryBot.define do
  factory :message_thread do
    association :tenant
    course do
      association(:course, tenant: tenant, academic_year: association(:academic_year, tenant: tenant))
    end
    sequence(:subject) { |n| "Thread #{n}" }
    thread_type { "direct" }

    trait :without_course do
      course { nil }
    end
  end
end
