class AiTemplate < ApplicationRecord
  include TenantScoped

  belongs_to :created_by, class_name: "User"
  has_many :ai_invocations, dependent: :nullify

  validates :name, presence: true
  validates :task_type, presence: true
  validates :system_prompt, presence: true
  validates :user_prompt_template, presence: true
end
