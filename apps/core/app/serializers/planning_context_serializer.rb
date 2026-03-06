class PlanningContextSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :academic_year_id, :kind, :name, :status, :settings, :metadata, :created_by_id, :course_ids, :created_at, :updated_at

  def course_ids
    object.courses.pluck(:id)
  end
end
