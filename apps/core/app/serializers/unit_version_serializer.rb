class UnitVersionSerializer < ActiveModel::Serializer
  attributes :id, :unit_plan_id, :version_number, :title, :description,
    :essential_questions, :enduring_understandings, :created_at, :updated_at

  has_many :standards, if: :include_standards?

  def include_standards?
    instance_options[:include_standards] == true
  end
end
