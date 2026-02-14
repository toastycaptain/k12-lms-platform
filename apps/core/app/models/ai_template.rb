class AiTemplate < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft active archived].freeze

  belongs_to :created_by, class_name: "User"

  validates :task_type, presence: true, inclusion: { in: AiTaskPolicy::VALID_TASK_TYPES }
  validates :name, presence: true
  validates :system_prompt, presence: true
  validates :user_prompt_template, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }

  scope :active, -> { where(status: "active") }
  scope :for_task_type, ->(type) { where(task_type: type) }

  def render(vars = {})
    result = user_prompt_template.dup
    variables.each do |var|
      var_name = var["name"] || var[:name]
      required = var["required"] || var[:required]
      value = vars[var_name.to_sym] || vars[var_name.to_s]
      raise ArgumentError, "Missing required variable: #{var_name}" if required && value.blank?
      result.gsub!("{{#{var_name}}}", value.to_s)
    end
    result
  end

  def activate!
    update!(status: "active")
  end

  def archive!
    update!(status: "archived")
  end
end
