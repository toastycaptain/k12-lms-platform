class RenameErrorsOnIbImportRows < ActiveRecord::Migration[8.1]
  def change
    rename_column :ib_import_rows, :errors, :error_messages
  end
end
