class CurriculumDocumentVersion < ApplicationRecord
  include TenantScoped

  belongs_to :curriculum_document
  belongs_to :created_by, class_name: "User"
  has_many :alignments, class_name: "CurriculumDocumentVersionAlignment", dependent: :destroy, inverse_of: :curriculum_document_version
  has_many :standards, through: :alignments

  validates :version_number, presence: true, uniqueness: { scope: :curriculum_document_id }
  validates :title, presence: true
  validates :content, presence: true
  validate :content_must_be_object

  private

  def content_must_be_object
    return if content.is_a?(Hash)

    errors.add(:content, "must be an object")
  end
end
