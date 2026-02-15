class AiTemplate < ApplicationRecord
  include TenantScoped

  VALID_STATUSES = %w[draft active archived].freeze
  VALID_TASK_TYPES = %w[lesson_plan unit_plan differentiation assessment rewrite].freeze

  belongs_to :created_by, class_name: "User"
  has_many :ai_invocations, dependent: :nullify

  validates :name, presence: true
  validates :task_type, presence: true, inclusion: { in: VALID_TASK_TYPES }
  validates :system_prompt, presence: true
  validates :user_prompt_template, presence: true
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
end
