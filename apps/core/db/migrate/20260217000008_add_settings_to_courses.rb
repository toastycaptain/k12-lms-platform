class AddSettingsToCourses < ActiveRecord::Migration[8.1]
  def change
    add_column :courses, :settings, :jsonb, null: false, default: {}, if_not_exists: true
  end
end
