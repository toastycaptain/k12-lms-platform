class Standard < ApplicationRecord
  include TenantScoped

  belongs_to :standard_framework
  belongs_to :parent, class_name: "Standard", optional: true
  has_many :children, class_name: "Standard", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent

  validates :code, presence: true

  scope :roots, -> { where(parent_id: nil) }

  def tree
    {
      id: id,
      code: code,
      description: description,
      grade_band: grade_band,
      children: children.includes(:children).map(&:tree)
    }
  end
end
