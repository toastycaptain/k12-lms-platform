class CreateIbPhase8FoundationModels < ActiveRecord::Migration[8.1]
  def change
    create_table :ib_release_baselines do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :created_by, null: true, foreign_key: { to_table: :users }
      t.references :certified_by, null: true, foreign_key: { to_table: :users }
      t.string :release_channel, null: false, default: "ib-ga-candidate"
      t.string :status, null: false, default: "draft"
      t.string :pack_key, null: false
      t.string :pack_version, null: false
      t.string :ci_status, null: false, default: "pending"
      t.string :migration_status, null: false, default: "pending"
      t.jsonb :checklist, null: false, default: {}
      t.jsonb :flag_snapshot, null: false, default: {}
      t.jsonb :dependency_snapshot, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :verified_at
      t.datetime :certified_at
      t.datetime :rolled_back_at
      t.timestamps
    end
    add_index :ib_release_baselines, [ :tenant_id, :school_id, :release_channel ], unique: true, name: :idx_ib_release_baselines_scope

    create_table :ib_reports do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :academic_year, null: true, foreign_key: true
      t.references :student, null: true, foreign_key: { to_table: :users }
      t.references :author, null: true, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "Mixed"
      t.string :report_family, null: false
      t.string :audience, null: false, default: "internal"
      t.string :status, null: false, default: "draft"
      t.string :title, null: false
      t.text :summary
      t.jsonb :source_refs, null: false, default: []
      t.jsonb :proofing_summary, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :released_at
      t.datetime :last_rendered_at
      t.timestamps
    end
    add_index :ib_reports, [ :tenant_id, :school_id, :programme, :report_family ], name: :idx_ib_reports_scope_family
    add_index :ib_reports, [ :tenant_id, :student_id, :status ], name: :idx_ib_reports_student_status

    create_table :ib_report_versions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_report, null: false, foreign_key: true
      t.references :signed_off_by, null: true, foreign_key: { to_table: :users }
      t.integer :version_number, null: false
      t.string :status, null: false, default: "draft"
      t.string :template_key, null: false
      t.jsonb :content_payload, null: false, default: {}
      t.jsonb :render_payload, null: false, default: {}
      t.jsonb :proofing_summary, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :signed_off_at
      t.datetime :rendered_at
      t.timestamps
    end
    add_index :ib_report_versions, [ :ib_report_id, :version_number ], unique: true, name: :idx_ib_report_versions_number

    create_table :ib_report_deliveries do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :ib_report, null: false, foreign_key: true
      t.references :ib_report_version, null: true, foreign_key: true
      t.references :recipient, null: true, foreign_key: { to_table: :users }
      t.string :audience_role, null: false, default: "guardian"
      t.string :channel, null: false, default: "web"
      t.string :locale, null: false, default: "en"
      t.string :status, null: false, default: "queued"
      t.text :error_message
      t.jsonb :metadata, null: false, default: {}
      t.datetime :delivered_at
      t.datetime :read_at
      t.datetime :acknowledged_at
      t.datetime :failed_at
      t.timestamps
    end
    add_index :ib_report_deliveries, [ :ib_report_id, :recipient_id, :channel ], name: :idx_ib_report_deliveries_target

    create_table :ib_collaboration_sessions do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :curriculum_document, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :session_key, null: false
      t.string :scope_type, null: false, default: "document"
      t.string :scope_key, null: false, default: "root"
      t.string :status, null: false, default: "active"
      t.string :role, null: false, default: "editor"
      t.string :device_label
      t.datetime :last_seen_at, null: false
      t.datetime :expires_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_collaboration_sessions, [ :curriculum_document_id, :status ], name: :idx_ib_collaboration_sessions_document_status
    add_index :ib_collaboration_sessions, [ :tenant_id, :user_id, :session_key ], unique: true, name: :idx_ib_collaboration_sessions_unique

    create_table :ib_saved_searches do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :query
      t.string :lens_key, null: false, default: "custom"
      t.string :scope_key, null: false, default: "ib"
      t.string :share_token
      t.jsonb :filters, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.datetime :last_run_at
      t.timestamps
    end
    add_index :ib_saved_searches, [ :tenant_id, :user_id, :scope_key ], name: :idx_ib_saved_searches_scope
    add_index :ib_saved_searches, :share_token, unique: true

    create_table :ib_communication_preferences do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :audience, null: false, default: "guardian"
      t.string :locale, null: false, default: "en"
      t.string :digest_cadence, null: false, default: "weekly_digest"
      t.string :quiet_hours_start, null: false, default: "20:00"
      t.string :quiet_hours_end, null: false, default: "07:00"
      t.string :quiet_hours_timezone, null: false, default: "UTC"
      t.jsonb :delivery_rules, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_communication_preferences, [ :tenant_id, :school_id, :user_id, :audience ], unique: true, name: :idx_ib_communication_preferences_scope

    create_table :ib_delivery_receipts do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.string :deliverable_type, null: false
      t.bigint :deliverable_id, null: false
      t.string :audience_role, null: false, default: "guardian"
      t.string :state, null: false, default: "delivered"
      t.string :locale
      t.jsonb :metadata, null: false, default: {}
      t.datetime :read_at
      t.datetime :acknowledged_at
      t.timestamps
    end
    add_index :ib_delivery_receipts,
      [ :tenant_id, :user_id, :deliverable_type, :deliverable_id, :audience_role ],
      unique: true,
      name: :idx_ib_delivery_receipts_unique
  end
end
