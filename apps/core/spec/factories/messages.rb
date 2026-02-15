FactoryBot.define do
  factory :message do
    association :tenant
    message_thread do
      association(:message_thread, tenant: tenant)
    end
    sender do
      association(:user, tenant: tenant)
    end
    body { "Hello from a message" }
  end
end
