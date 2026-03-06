class CreateCurriculumDocumentVersionAlignments < ActiveRecord::Migration[8.1]
  def change
    create_table :curriculum_document_version_alignments do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :curriculum_document_version, null: false, foreign_key: true
      t.references :standard, null: false, foreign_key: true
      t.string :alignment_type, null: false, default: "aligned"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :curriculum_document_version_alignments,
      [ :curriculum_document_version_id, :standard_id, :alignment_type ],
      unique: true,
      name: "idx_curriculum_doc_version_alignments_unique"
    add_index :curriculum_document_version_alignments, [ :tenant_id, :standard_id ],
      name: "idx_curriculum_doc_version_alignments_standard"
  end
end
