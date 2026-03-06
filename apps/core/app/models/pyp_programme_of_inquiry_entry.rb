class PypProgrammeOfInquiryEntry < ApplicationRecord
  include TenantScoped

  REVIEW_STATES = %w[draft in_review approved].freeze
  COHERENCE_SIGNALS = %w[healthy watch risk].freeze

  belongs_to :pyp_programme_of_inquiry
  belongs_to :planning_context, optional: true
  belongs_to :curriculum_document, optional: true

  validates :year_level, :theme, :title, presence: true
  validates :review_state, inclusion: { in: REVIEW_STATES }
  validates :coherence_signal, inclusion: { in: COHERENCE_SIGNALS }
  validates :theme, uniqueness: { scope: [ :pyp_programme_of_inquiry_id, :year_level ] }
end
