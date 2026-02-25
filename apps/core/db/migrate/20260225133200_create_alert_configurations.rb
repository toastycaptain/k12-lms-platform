class CreateAlertConfigurations < ActiveRecord::Migration[8.1]
  def change
    create_table :alert_configurations do |t|
      t.references :tenant, null: true, foreign_key: true
      t.string :name, null: false
      t.string :metric, null: false
      t.string :comparison, null: false
      t.float :threshold, null: false
      t.string :severity, null: false, default: "warning"
      t.boolean :enabled, null: false, default: true
      t.string :notification_channel, null: false, default: "slack"
      t.string :notification_target
      t.integer :cooldown_minutes, null: false, default: 30
      t.datetime :last_triggered_at
      t.integer :trigger_count, null: false, default: 0

      t.timestamps
    end

    add_index :alert_configurations, :metric
    add_index :alert_configurations, [ :enabled, :metric ]
  end
end
