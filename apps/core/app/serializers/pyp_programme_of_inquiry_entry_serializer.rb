class PypProgrammeOfInquiryEntrySerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :pyp_programme_of_inquiry_id, :planning_context_id, :curriculum_document_id,
    :year_level, :theme, :title, :central_idea, :review_state, :coherence_signal,
    :specialist_expectations, :metadata, :created_at, :updated_at
end
