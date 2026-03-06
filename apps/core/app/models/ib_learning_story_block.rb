class IbLearningStoryBlock < ApplicationRecord
  include TenantScoped

  BLOCK_TYPES = %w[narrative quote prompt celebration next_step].freeze

  belongs_to :ib_learning_story

  validates :block_type, inclusion: { in: BLOCK_TYPES }
  validates :content, presence: true
end
