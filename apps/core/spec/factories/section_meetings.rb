FactoryBot.define do
  factory :section_meeting do
    association :tenant
    association :section
    weekday { Time.current.wday }
    start_time { "09:00" }
    end_time { "10:00" }
    location { "Room 101" }
  end
end
