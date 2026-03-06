class CurriculumDocument < ApplicationRecord
  include TenantScoped
  include AttachmentValidatable

  belongs_to :planning_context
  belongs_to :school
  belongs_to :academic_year, optional: true
  belongs_to :created_by, class_name: "User"
  belongs_to :current_version, class_name: "CurriculumDocumentVersion", optional: true

  has_many :versions, class_name: "CurriculumDocumentVersion", dependent: :destroy
  has_many :outgoing_links, class_name: "CurriculumDocumentLink", foreign_key: :source_document_id, dependent: :destroy
  has_many :incoming_links, class_name: "CurriculumDocumentLink", foreign_key: :target_document_id, dependent: :destroy
  has_many :approvals, as: :approvable, dependent: :destroy

  has_one_attached :exported_pdf
  validates_attachment :exported_pdf,
    content_types: %w[application/pdf],
    max_size: 100.megabytes

  validates :title, presence: true
  validates :document_type, presence: true
  validates :pack_key, :pack_version, :schema_key, presence: true
  attr_readonly :pack_key, :pack_version, :schema_key

  def create_version!(title:, content:, created_by:)
    normalized_content =
      if content.respond_to?(:to_unsafe_h)
        content.to_unsafe_h
      elsif content.respond_to?(:to_h) && !content.is_a?(Hash)
        content.to_h
      else
        content
      end

    with_lock do
      next_number = (versions.maximum(:version_number) || 0) + 1
      Curriculum::DocumentContentService.validate_content!(
        tenant: tenant,
        pack_key: pack_key,
        pack_version: pack_version,
        document_type: document_type,
        schema_key: schema_key,
        content: normalized_content
      )

      version = versions.create!(
        tenant: tenant,
        version_number: next_number,
        title: title,
        content: normalized_content,
        created_by: created_by
      )
      update!(current_version: version, title: title)
      version
    end
  end
end
