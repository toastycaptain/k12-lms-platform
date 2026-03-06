class PypProgrammeOfInquiry < ApplicationRecord
  include TenantScoped

  STATUS_TYPES = %w[draft in_review published archived].freeze

  belongs_to :school
  belongs_to :academic_year
  belongs_to :coordinator, class_name: "User", optional: true

  has_many :entries, class_name: "PypProgrammeOfInquiryEntry", dependent: :destroy

  validates :title, presence: true
  validates :status, inclusion: { in: STATUS_TYPES }
end
