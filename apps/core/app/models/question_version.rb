class QuestionVersion < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft published archived].freeze

  belongs_to :question
  belongs_to :created_by, class_name: "User", optional: true

  validates :version_number, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validates :version_number, uniqueness: { scope: :question_id }
  validates :question_type, presence: true
  validates :content, presence: true
  validates :points, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: VALID_STATUSES }

  validate :question_must_match_tenant
  validate :created_by_must_match_tenant

  private

  def question_must_match_tenant
    return if question.blank? || tenant_id.blank?
    return if question.tenant_id == tenant_id

    errors.add(:question_id, "must belong to the same tenant")
  end

  def created_by_must_match_tenant
    return if created_by.blank? || tenant_id.blank?
    return if created_by.tenant_id == tenant_id

    errors.add(:created_by_id, "must belong to the same tenant")
  end
end
