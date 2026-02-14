FactoryBot.define do
  factory :sync_log do
    association :tenant
    association :sync_run
    level { "info" }
    message { "Sync started" }
  end
end
