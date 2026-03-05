class CreateCurriculumProfileReleases < ActiveRecord::Migration[8.0]
  def change
    create_table :curriculum_profile_releases do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :imported_by, foreign_key: { to_table: :users }

      t.string :profile_key, null: false
      t.string :profile_version, null: false
      t.string :status, null: false, default: "draft"
      t.string :checksum
      t.datetime :published_at
      t.datetime :deprecated_at
      t.datetime :frozen_at
      t.string :rolled_back_from_version

      t.jsonb :payload, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}

      t.timestamps
    end

    add_index :curriculum_profile_releases,
              [ :tenant_id, :profile_key, :profile_version ],
              unique: true,
              name: "idx_curriculum_profile_releases_identity"
    add_index :curriculum_profile_releases,
              [ :tenant_id, :profile_key, :status ],
              name: "idx_curriculum_profile_releases_state"
  end
end
