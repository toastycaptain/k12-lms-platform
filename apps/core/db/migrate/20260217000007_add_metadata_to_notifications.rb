class AddMetadataToNotifications < ActiveRecord::Migration[8.1]
  def change
    add_column :notifications, :metadata, :jsonb, null: false, default: {}, if_not_exists: true
  end
end
