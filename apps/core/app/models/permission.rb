class Permission < ApplicationRecord
  include TenantScoped

  VALID_RESOURCES = %w[
    academic_years
    announcements
    approvals
    assignments
    attempt_answers
    audit_logs
    courses
    course_modules
    data_retention_policies
    discussions
    discussion_posts
    enrollments
    guardian_links
    integration_configs
    lesson_plans
    lesson_versions
    lti_registrations
    lti_resource_links
    message_threads
    messages
    module_items
    notifications
    permissions
    question_banks
    questions
    question_versions
    quizzes
    quiz_attempts
    quiz_items
    resource_links
    rubrics
    rubric_criteria
    rubric_ratings
    schools
    search
    sections
    standards
    standard_frameworks
    submissions
    sync_logs
    sync_mappings
    sync_runs
    templates
    template_versions
    terms
    unit_plans
    unit_versions
    users
  ].freeze

  VALID_ACTIONS = %w[read create update delete publish approve manage].freeze

  belongs_to :role

  validates :resource, presence: true, inclusion: { in: VALID_RESOURCES }
  validates :action, presence: true, inclusion: { in: VALID_ACTIONS }
  validates :granted, inclusion: { in: [ true, false ] }
  validates :role_id, uniqueness: { scope: [ :tenant_id, :resource, :action ] }

  scope :for_role, lambda { |role|
    role_id = role.respond_to?(:id) ? role.id : role
    where(role_id: role_id)
  }

  def self.granted_for(role_or_roles, resource, action)
    role_ids = Array(role_or_roles).flat_map do |value|
      if value.respond_to?(:ids)
        value.ids
      else
        value.respond_to?(:id) ? value.id : value
      end
    end.compact

    return false if role_ids.empty? || Current.tenant.blank?

    exists?(
      tenant: Current.tenant,
      role_id: role_ids,
      resource: resource.to_s,
      action: action.to_s,
      granted: true
    )
  end
end
