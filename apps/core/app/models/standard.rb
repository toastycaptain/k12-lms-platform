class Standard < ApplicationRecord
  include TenantScoped

  belongs_to :standard_framework
  belongs_to :parent, class_name: "Standard", optional: true
  has_many :children, class_name: "Standard", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent

  validates :code, presence: true

  scope :roots, -> { where(parent_id: nil) }

  def tree
    all_descendants = Standard.where(standard_framework_id: standard_framework_id).to_a
    self.class.build_subtree(all_descendants, id)
  end

  def self.build_tree(standards)
    grouped = standards.group_by(&:parent_id)
    build_nodes(grouped, nil)
  end

  def self.build_nodes(grouped, parent_id)
    (grouped[parent_id] || []).map do |standard|
      { id: standard.id, code: standard.code, description: standard.description,
        grade_band: standard.grade_band, children: build_nodes(grouped, standard.id) }
    end
  end

  def self.build_subtree(standards, root_id)
    root = standards.find { |s| s.id == root_id }
    return nil unless root

    grouped = standards.group_by(&:parent_id)
    { id: root.id, code: root.code, description: root.description,
      grade_band: root.grade_band, children: build_nodes(grouped, root.id) }
  end
end
