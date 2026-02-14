class CreateApprovals < ActiveRecord::Migration[8.1]
  def change
    create_table :approvals do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.string :approvable_type, null: false
      t.bigint :approvable_id, null: false
      t.string :status, null: false, default: "pending"
      t.references :requested_by, null: false, foreign_key: { to_table: :users }
      t.references :reviewed_by, foreign_key: { to_table: :users }
      t.text :comments
      t.datetime :reviewed_at

      t.timestamps
    end

    add_index :approvals, [ :approvable_type, :approvable_id ]
  end
end
