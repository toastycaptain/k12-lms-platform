module SafeMigration
  def safe_change_column_null(table_name, column_name, null:, default: nil)
    if null == false && default.nil?
      raise ArgumentError, "NOT NULL change requires a default to avoid write outages"
    end

    change_column_default(table_name, column_name, default) unless default.nil?
    change_column_null(table_name, column_name, null)
  end

  def safe_rename_column(_table_name, _old_name, _new_name)
    raise ArgumentError, "Direct column renames are disallowed. Add new column and backfill instead."
  end
end
