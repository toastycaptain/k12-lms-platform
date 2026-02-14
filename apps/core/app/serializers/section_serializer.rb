class SectionSerializer < ActiveModel::Serializer
  attributes :id, :name, :course_id, :term_id, :created_at, :updated_at
end
