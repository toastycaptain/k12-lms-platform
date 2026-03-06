class CreatePlanningContexts < ActiveRecord::Migration[8.1]
  def change
    create_table :planning_contexts do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :academic_year, null: false, foreign_key: true
      t.string :kind, null: false
      t.string :name, null: false
      t.string :status, null: false, default: "active"
      t.jsonb :settings, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_index :planning_contexts, [ :tenant_id, :school_id, :academic_year_id, :kind ],
      name: "idx_planning_contexts_tenant_school_year_kind"
  end
end
