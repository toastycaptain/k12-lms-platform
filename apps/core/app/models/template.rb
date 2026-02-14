class Template < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft published archived].freeze

  belongs_to :created_by, class_name: "User"
  belongs_to :current_version, class_name: "TemplateVersion", optional: true
  has_many :template_versions, dependent: :destroy

  validates :name, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  def create_version!(attrs = {})
    next_number = (template_versions.maximum(:version_number) || 0) + 1
    version = template_versions.create!(
      tenant: tenant,
      version_number: next_number,
      title: attrs[:title] || name,
      description: attrs[:description],
      essential_questions: attrs[:essential_questions] || [],
      enduring_understandings: attrs[:enduring_understandings] || [],
      suggested_duration_weeks: attrs[:suggested_duration_weeks]
    )
    update!(current_version: version)
    version
  end

  def create_unit_from_template!(course:, user:)
    version = current_version
    unit_plan = UnitPlan.create!(
      tenant: tenant,
      course: course,
      created_by: user,
      title: version.title,
      status: "draft"
    )

    unit_version = unit_plan.create_version!(
      title: version.title,
      description: version.description,
      essential_questions: version.essential_questions,
      enduring_understandings: version.enduring_understandings
    )

    version.template_version_standards.find_each do |tvs|
      UnitVersionStandard.create!(
        tenant: tenant,
        unit_version: unit_version,
        standard: tvs.standard
      )
    end

    unit_plan
  end

  def publish!
    raise ActiveRecord::RecordInvalid, self unless status == "draft"
    raise ActiveRecord::RecordInvalid, self unless current_version.present?

    update!(status: "published")
  end

  def archive!
    raise ActiveRecord::RecordInvalid, self unless status == "published"

    update!(status: "archived")
  end
end
