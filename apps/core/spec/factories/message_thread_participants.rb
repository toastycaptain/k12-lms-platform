FactoryBot.define do
  factory :message_thread_participant do
    association :tenant
    message_thread do
      association(:message_thread, tenant: tenant)
    end
    user do
      association(:user, tenant: tenant)
    end
    last_read_at { nil }
  end
end
