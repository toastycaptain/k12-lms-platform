class Question < ApplicationRecord
  include TenantScoped

  VALID_TYPES = %w[multiple_choice true_false short_answer essay matching fill_in_blank].freeze
  VALID_STATUSES = %w[active archived].freeze
  AUTO_GRADABLE_TYPES = %w[multiple_choice true_false short_answer matching fill_in_blank].freeze

  belongs_to :question_bank
  belongs_to :created_by, class_name: "User"

  validates :prompt, presence: true
  validates :question_type, presence: true, inclusion: { in: VALID_TYPES }
  validates :status, presence: true, inclusion: { in: VALID_STATUSES }
  validates :points, numericality: { greater_than: 0 }

  def auto_gradable?
    AUTO_GRADABLE_TYPES.include?(question_type)
  end
end
