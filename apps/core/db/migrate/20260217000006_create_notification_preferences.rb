class CreateNotificationPreferences < ActiveRecord::Migration[8.1]
  def change
    create_table :notification_preferences do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :event_type, null: false
      t.boolean :in_app, null: false, default: true
      t.boolean :email, null: false, default: true
      t.string :email_frequency, null: false, default: "immediate"

      t.timestamps
    end

    add_index :notification_preferences, [ :user_id, :event_type ], unique: true, name: "idx_notification_prefs_user_event"
  end
end
