class TermSerializer < ActiveModel::Serializer
  attributes :id, :name, :start_date, :end_date, :academic_year_id, :created_at, :updated_at
end
