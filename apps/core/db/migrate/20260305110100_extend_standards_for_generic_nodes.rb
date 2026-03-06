class ExtendStandardsForGenericNodes < ActiveRecord::Migration[8.1]
  def change
    change_column_null :standards, :code, true
    add_column :standards, :kind, :string, null: false, default: "standard"
    add_column :standards, :label, :string
    add_column :standards, :identifier, :string
    add_column :standards, :metadata, :jsonb, null: false, default: {}

    add_index :standards, [ :tenant_id, :standard_framework_id ], name: "idx_standards_tenant_framework"
    add_index :standards, [ :tenant_id, :kind ], name: "idx_standards_tenant_kind"
  end
end
