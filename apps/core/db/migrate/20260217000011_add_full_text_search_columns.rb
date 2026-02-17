class AddFullTextSearchColumns < ActiveRecord::Migration[8.1]
  SEARCH_TABLES = %i[
    unit_plans
    lesson_plans
    courses
    standards
    assignments
    question_banks
  ].freeze

  def change
    SEARCH_TABLES.each do |table_name|
      add_column table_name, :search_vector, :tsvector, if_not_exists: true
      add_index table_name, :search_vector, using: :gin, if_not_exists: true
    end
  end
end
