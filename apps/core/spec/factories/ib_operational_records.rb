FactoryBot.define do
  factory :ib_operational_record do
    association :tenant
    school { association(:school, tenant: tenant) }
    planning_context { association(:planning_context, tenant: tenant, school: school) }
    programme { "DP" }
    record_family { "dp_ia" }
    subtype { "ia" }
    status { "open" }
    priority { "normal" }
    risk_level { "healthy" }
    sequence(:title) { |n| "Operational Record #{n}" }
    summary { "Live operational workflow." }
    next_action { "Review the next checkpoint." }
    metadata { {} }
  end

  factory :ib_operational_checkpoint do
    association :tenant
    association :ib_operational_record
    sequence(:title) { |n| "Checkpoint #{n}" }
    status { "pending" }
    position { 0 }
    metadata { {} }
  end
end
