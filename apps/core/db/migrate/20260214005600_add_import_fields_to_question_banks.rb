class AddImportFieldsToQuestionBanks < ActiveRecord::Migration[8.1]
  def change
    add_column :question_banks, :import_status, :string
    add_column :question_banks, :import_errors, :jsonb, default: []
  end
end
