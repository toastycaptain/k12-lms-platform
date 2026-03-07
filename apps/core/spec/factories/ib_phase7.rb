FactoryBot.define do
  factory :ib_document_collaborator do
    curriculum_document
    tenant { curriculum_document.tenant }
    user { association(:user, tenant: tenant) }
    assigned_by { association(:user, tenant: tenant) }
    role { "specialist_contributor" }
    status { "active" }
    contribution_mode { "comment" }
    metadata { {} }
  end

  factory :ib_reflection_request do
    ib_evidence_item
    tenant { ib_evidence_item.tenant }
    requested_by { association(:user, tenant: tenant) }
    student { ib_evidence_item.student || association(:user, tenant: tenant) }
    prompt { "What changed in your thinking after feedback?" }
    status { "requested" }
    due_on { 3.days.from_now.to_date }
    response_excerpt { nil }
    metadata { {} }
  end

  factory :ib_activity_event do
    association :tenant
    school { association(:school, tenant: tenant) }
    user { association(:user, tenant: tenant) }
    event_name { "ib.route.view" }
    event_family { "teacher_workflow" }
    surface { "teacher_home" }
    programme { "Mixed" }
    route_id { "ib.home" }
    entity_ref { "route:/ib/home" }
    document_type { nil }
    session_key { "session-1" }
    dedupe_key { nil }
    metadata { {} }
    occurred_at { Time.current }
  end

  factory :ib_user_workspace_preference do
    association :tenant
    school { association(:school, tenant: tenant) }
    user { association(:user, tenant: tenant) }
    surface { "teacher_home" }
    context_key { "pins" }
    preference_key { "teacher_home" }
    scope_key { "school:#{school.id}|mixed|teacher" }
    value { { "entity_refs" => [] } }
    metadata { {} }
  end

  factory :ib_specialist_library_item do
    association :tenant
    school { association(:school, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    programme { "Mixed" }
    item_type { "resource" }
    sequence(:title) { |n| "Specialist Library Item #{n}" }
    summary { "Reusable specialist support artifact." }
    content { { "body" => "Example content" } }
    tags { [ "specialist", "reuse" ] }
    source_entity_ref { nil }
    metadata { {} }
  end

  factory :ib_portfolio_collection do
    association :tenant
    school { association(:school, tenant: tenant) }
    student { association(:user, tenant: tenant) }
    created_by { association(:user, tenant: tenant) }
    sequence(:title) { |n| "Portfolio Collection #{n}" }
    narrative_summary { "A curated progression arc." }
    visibility { "private" }
    shared_token { nil }
    filters { {} }
    item_refs { [] }
    metadata { {} }
  end

  factory :ib_learning_story_translation do
    ib_learning_story
    tenant { ib_learning_story.tenant }
    translated_by { association(:user, tenant: tenant) }
    locale { "es" }
    state { "reviewed" }
    translated_title { "Historia traducida" }
    translated_summary { "Resumen traducido" }
    translated_support_prompt { "Pregunta sobre el aprendizaje de hoy." }
    metadata { {} }
  end
end
