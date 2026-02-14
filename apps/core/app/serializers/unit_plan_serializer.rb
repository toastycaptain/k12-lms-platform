class UnitPlanSerializer < ActiveModel::Serializer
  attributes :id, :title, :status, :course_id, :created_by_id, :current_version_id, :version_count, :created_at, :updated_at

  def version_count
    object.unit_versions.size
  end
end
