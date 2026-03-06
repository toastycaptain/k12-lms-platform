class CreateCurriculumDocumentVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :curriculum_document_versions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :curriculum_document, null: false, foreign_key: true
      t.integer :version_number, null: false
      t.string :title, null: false
      t.jsonb :content, null: false, default: {}
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.timestamps
    end

    add_index :curriculum_document_versions, [ :curriculum_document_id, :version_number ], unique: true,
      name: "idx_curriculum_document_versions_doc_version"
    add_index :curriculum_document_versions, [ :tenant_id, :curriculum_document_id ],
      name: "idx_curriculum_document_versions_tenant_doc"

    add_foreign_key :curriculum_documents, :curriculum_document_versions, column: :current_version_id
  end
end
