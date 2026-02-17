class Question < ApplicationRecord
  include TenantScoped

  VALID_TYPES = %w[multiple_choice true_false short_answer essay matching fill_in_blank].freeze
  VALID_STATUSES = %w[active archived].freeze
  AUTO_GRADABLE_TYPES = %w[multiple_choice true_false short_answer matching fill_in_blank].freeze

  belongs_to :question_bank
  belongs_to :created_by, class_name: "User"
  belongs_to :current_version, class_name: "QuestionVersion", optional: true
  has_many :question_versions, dependent: :destroy

  validates :prompt, presence: true
  validates :question_type, presence: true, inclusion: { in: VALID_TYPES }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :points, numericality: { greater_than: 0 }

  def auto_gradable?
    AUTO_GRADABLE_TYPES.include?(question_type)
  end

  def create_version!(attrs = {})
    latest_version = question_versions.order(version_number: :desc).first
    next_number = (latest_version&.version_number || 0) + 1

    version = question_versions.create!(
      tenant: tenant,
      version_number: next_number,
      question_type: attrs[:question_type] || latest_version&.question_type || question_type,
      content: attrs[:content] || latest_version&.content || prompt,
      choices: attrs.fetch(:choices, latest_version&.choices || choices),
      correct_answer: attrs.fetch(:correct_answer, latest_version&.correct_answer || correct_answer),
      explanation: attrs.fetch(:explanation, latest_version&.explanation || explanation),
      points: attrs[:points] || latest_version&.points || points,
      metadata: attrs[:metadata] || {},
      status: attrs[:status] || latest_version&.status || "draft",
      created_by: attrs[:created_by]
    )

    update!(current_version: version)
    version
  end
end
