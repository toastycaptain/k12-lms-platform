class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    return if table_exists?(:notifications)

    create_table :notifications do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :actor, foreign_key: { to_table: :users }
      t.string :notification_type, null: false
      t.string :title, null: false
      t.text :message
      t.string :url
      t.string :notifiable_type
      t.bigint :notifiable_id
      t.datetime :read_at
      t.timestamps
    end

    add_index :notifications, [ :user_id, :read_at ] unless index_exists?(:notifications, [ :user_id, :read_at ])
    unless index_exists?(:notifications, [ :notifiable_type, :notifiable_id ])
      add_index :notifications, [ :notifiable_type, :notifiable_id ]
    end
  end
end
