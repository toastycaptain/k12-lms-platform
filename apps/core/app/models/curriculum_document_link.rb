class CurriculumDocumentLink < ApplicationRecord
  include TenantScoped

  RELATIONSHIP_TYPES = %w[contains derives_from aligned_with].freeze

  belongs_to :source_document, class_name: "CurriculumDocument"
  belongs_to :target_document, class_name: "CurriculumDocument"

  validates :relationship_type, presence: true
  validates :relationship_type, inclusion: { in: RELATIONSHIP_TYPES }
  validates :target_document_id, uniqueness: { scope: [ :source_document_id, :relationship_type ] }
  validate :source_and_target_must_differ
  validate :documents_must_share_tenant

  private

  def source_and_target_must_differ
    return unless source_document_id.present? && source_document_id == target_document_id

    errors.add(:target_document_id, "must be different from source_document_id")
  end

  def documents_must_share_tenant
    return if source_document.blank? || target_document.blank?
    return if source_document.tenant_id == target_document.tenant_id

    errors.add(:target_document_id, "must belong to the same tenant as source_document")
  end
end
