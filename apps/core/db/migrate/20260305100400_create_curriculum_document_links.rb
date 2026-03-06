class CreateCurriculumDocumentLinks < ActiveRecord::Migration[8.1]
  def change
    create_table :curriculum_document_links do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :source_document, null: false, foreign_key: { to_table: :curriculum_documents }
      t.references :target_document, null: false, foreign_key: { to_table: :curriculum_documents }
      t.string :relationship_type, null: false
      t.integer :position, null: false, default: 0
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :curriculum_document_links,
      [ :source_document_id, :target_document_id, :relationship_type ],
      unique: true,
      name: "idx_curriculum_document_links_unique"
    add_index :curriculum_document_links,
      [ :tenant_id, :source_document_id, :relationship_type, :position ],
      name: "idx_curriculum_document_links_source_rel_position"
    add_index :curriculum_document_links, [ :tenant_id, :target_document_id ], name: "idx_curriculum_document_links_target"
    add_check_constraint :curriculum_document_links, "source_document_id <> target_document_id", name: "curriculum_document_links_not_self"
  end
end
