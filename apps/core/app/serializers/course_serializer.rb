class CourseSerializer < ActiveModel::Serializer
  attributes :id, :name, :code, :description, :academic_year_id, :created_at, :updated_at
  has_many :sections
end
