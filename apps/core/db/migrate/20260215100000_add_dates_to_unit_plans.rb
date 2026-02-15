class AddDatesToUnitPlans < ActiveRecord::Migration[8.1]
  def change
    add_column :unit_plans, :start_date, :date unless column_exists?(:unit_plans, :start_date)
    add_column :unit_plans, :end_date, :date unless column_exists?(:unit_plans, :end_date)
  end
end
