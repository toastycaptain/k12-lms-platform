class CurriculumDocumentVersionAlignment < ApplicationRecord
  include TenantScoped

  belongs_to :curriculum_document_version, inverse_of: :alignments
  belongs_to :standard

  validates :alignment_type, presence: true
  validates :standard_id, uniqueness: { scope: [ :curriculum_document_version_id, :alignment_type ] }
  validate :standard_and_document_share_tenant

  private

  def standard_and_document_share_tenant
    return if standard.blank? || curriculum_document_version.blank?
    return if standard.tenant_id == curriculum_document_version.tenant_id

    errors.add(:standard_id, "must belong to the same tenant as the document version")
  end
end
