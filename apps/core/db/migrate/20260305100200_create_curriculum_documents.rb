class CreateCurriculumDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :curriculum_documents do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :academic_year, null: true, foreign_key: true
      t.references :planning_context, null: false, foreign_key: true
      t.string :document_type, null: false
      t.string :title, null: false
      t.string :status, null: false, default: "draft"
      t.bigint :current_version_id
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :pack_key, null: false
      t.string :pack_version, null: false
      t.string :schema_key, null: false
      t.string :pack_payload_checksum
      t.jsonb :settings, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.tsvector :search_vector
      t.timestamps
    end

    add_index :curriculum_documents, [ :tenant_id, :school_id, :planning_context_id ], name: "idx_curriculum_documents_school_context"
    add_index :curriculum_documents, [ :tenant_id, :document_type ], name: "idx_curriculum_documents_type"
    add_index :curriculum_documents, :search_vector, using: :gin, name: "idx_curriculum_documents_search_vector"
    add_index :curriculum_documents, :current_version_id
  end
end
