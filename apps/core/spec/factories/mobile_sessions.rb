require "digest"
require "securerandom"

FactoryBot.define do
  factory :mobile_session do
    association :tenant
    association :user
    refresh_token_digest { Digest::SHA256.hexdigest(SecureRandom.hex(24)) }
    expires_at { 30.days.from_now }
    last_used_at { Time.current }
  end
end
