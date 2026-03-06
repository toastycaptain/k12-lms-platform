class ExtendStandardFrameworksForGenericFrameworks < ActiveRecord::Migration[8.1]
  def change
    add_column :standard_frameworks, :key, :string
    add_column :standard_frameworks, :framework_kind, :string, null: false, default: "standard"
    add_column :standard_frameworks, :metadata, :jsonb, null: false, default: {}
    add_column :standard_frameworks, :status, :string, null: false, default: "active"

    add_index :standard_frameworks, [ :tenant_id, :key ],
      unique: true,
      where: "key IS NOT NULL",
      name: "idx_standard_frameworks_tenant_key"
    add_index :standard_frameworks, [ :tenant_id, :framework_kind ], name: "idx_standard_frameworks_tenant_kind"
  end
end
