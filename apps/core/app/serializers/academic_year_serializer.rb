class AcademicYearSerializer < ActiveModel::Serializer
  attributes :id, :name, :start_date, :end_date, :current, :created_at, :updated_at
  has_many :terms
end
