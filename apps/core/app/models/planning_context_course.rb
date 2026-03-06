class PlanningContextCourse < ApplicationRecord
  include TenantScoped

  belongs_to :planning_context
  belongs_to :course

  validates :course_id, uniqueness: { scope: :planning_context_id }
  validate :course_and_context_share_tenant

  private

  def course_and_context_share_tenant
    return if course.blank? || planning_context.blank?
    return if course.tenant_id == planning_context.tenant_id

    errors.add(:course_id, "must belong to the same tenant as planning_context")
  end
end
