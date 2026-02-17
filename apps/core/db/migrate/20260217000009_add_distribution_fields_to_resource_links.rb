class AddDistributionFieldsToResourceLinks < ActiveRecord::Migration[8.1]
  def change
    add_column :resource_links, :link_type, :string, null: false, default: "reference", if_not_exists: true
    add_column :resource_links, :metadata, :jsonb, null: false, default: {}, if_not_exists: true
    add_index :resource_links, [ :linkable_type, :linkable_id, :link_type ], name: "idx_resource_links_linkable_type_kind", if_not_exists: true
  end
end
