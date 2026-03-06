class CreateIbPhase3Models < ActiveRecord::Migration[8.1]
  def change
    create_table :ib_document_collaborators do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :curriculum_document, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :assigned_by, foreign_key: { to_table: :users }
      t.string :role, null: false, default: "co_planner"
      t.string :status, null: false, default: "active"
      t.string :contribution_mode, null: false, default: "full"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_document_collaborators, [ :curriculum_document_id, :user_id, :role ], unique: true, name: "idx_ib_doc_collaborators_unique"

    create_table :ib_document_comments do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :curriculum_document, null: false, foreign_key: true
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.references :parent_comment, foreign_key: { to_table: :ib_document_comments }
      t.references :resolved_by, foreign_key: { to_table: :users }
      t.string :comment_type, null: false, default: "general"
      t.string :status, null: false, default: "open"
      t.string :visibility, null: false, default: "internal"
      t.string :anchor_path
      t.text :body, null: false
      t.datetime :resolved_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_document_comments, [ :curriculum_document_id, :status ], name: "idx_ib_doc_comments_status"

    create_table :ib_evidence_items do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :planning_context, foreign_key: true
      t.references :curriculum_document, foreign_key: true
      t.references :curriculum_document_version, foreign_key: true
      t.references :student, foreign_key: { to_table: :users }
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "PYP"
      t.string :status, null: false, default: "needs_validation"
      t.string :visibility, null: false, default: "undecided"
      t.string :contributor_type, null: false, default: "teacher"
      t.string :title, null: false
      t.text :summary
      t.text :next_action
      t.text :story_draft
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_evidence_items, [ :school_id, :programme, :status ], name: "idx_ib_evidence_items_queue"

    create_table :ib_reflection_requests do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_evidence_item, null: false, foreign_key: true
      t.references :requested_by, null: false, foreign_key: { to_table: :users }
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.string :status, null: false, default: "requested"
      t.date :due_on
      t.text :prompt, null: false
      t.text :response_excerpt
      t.datetime :responded_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :ib_learning_stories do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :planning_context, foreign_key: true
      t.references :curriculum_document, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "PYP"
      t.string :state, null: false, default: "draft"
      t.string :cadence, null: false, default: "weekly_digest"
      t.string :audience, null: false, default: "families"
      t.string :title, null: false
      t.text :summary
      t.text :support_prompt
      t.datetime :published_at
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_learning_stories, [ :school_id, :state ], name: "idx_ib_learning_stories_state"

    create_table :ib_learning_story_blocks do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_learning_story, null: false, foreign_key: true
      t.integer :position, null: false, default: 0
      t.string :block_type, null: false, default: "narrative"
      t.text :content, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_learning_story_blocks, [ :ib_learning_story_id, :position ], name: "idx_ib_learning_story_blocks_position"

    create_table :ib_learning_story_evidence_items do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_learning_story, null: false, foreign_key: true
      t.references :ib_evidence_item, null: false, foreign_key: true
      t.timestamps
    end
    add_index :ib_learning_story_evidence_items, [ :ib_learning_story_id, :ib_evidence_item_id ], unique: true, name: "idx_ib_story_evidence_unique"

    create_table :ib_publishing_queue_items do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :ib_learning_story, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :state, null: false, default: "draft"
      t.datetime :scheduled_for
      t.datetime :delivered_at
      t.text :held_reason
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_publishing_queue_items, [ :school_id, :state ], name: "idx_ib_publishing_queue_state"

    create_table :ib_publishing_audits do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :ib_learning_story, foreign_key: true
      t.references :ib_publishing_queue_item, foreign_key: true
      t.references :changed_by, foreign_key: { to_table: :users }
      t.string :event_type, null: false
      t.jsonb :details, null: false, default: {}
      t.timestamps
    end

    create_table :pyp_programme_of_inquiries do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :academic_year, null: false, foreign_key: true
      t.references :coordinator, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.string :status, null: false, default: "draft"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :pyp_programme_of_inquiries, [ :school_id, :academic_year_id ], unique: true, name: "idx_pyp_poi_school_year"

    create_table :pyp_programme_of_inquiry_entries do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :pyp_programme_of_inquiry, null: false, foreign_key: true
      t.references :planning_context, foreign_key: true
      t.references :curriculum_document, foreign_key: true
      t.string :year_level, null: false
      t.string :theme, null: false
      t.string :title, null: false
      t.text :central_idea
      t.string :review_state, null: false, default: "draft"
      t.string :coherence_signal, null: false, default: "healthy"
      t.jsonb :specialist_expectations, null: false, default: []
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :pyp_programme_of_inquiry_entries, [ :pyp_programme_of_inquiry_id, :year_level, :theme ], unique: true, name: "idx_pyp_poi_entries_unique"

    create_table :ib_operational_records do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :planning_context, foreign_key: true
      t.references :curriculum_document, foreign_key: true
      t.references :student, foreign_key: { to_table: :users }
      t.references :owner, foreign_key: { to_table: :users }
      t.references :advisor, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "PYP"
      t.string :record_family, null: false
      t.string :subtype, null: false
      t.string :status, null: false, default: "draft"
      t.string :priority, null: false, default: "normal"
      t.string :risk_level, null: false, default: "healthy"
      t.date :due_on
      t.string :title, null: false
      t.text :summary
      t.text :next_action
      t.string :route_hint
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_operational_records, [ :school_id, :programme, :record_family ], name: "idx_ib_operational_records_programme_family"

    create_table :ib_operational_checkpoints do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_operational_record, null: false, foreign_key: true
      t.references :reviewer, foreign_key: { to_table: :users }
      t.integer :position, null: false, default: 0
      t.string :status, null: false, default: "pending"
      t.date :due_on
      t.datetime :completed_at
      t.string :title, null: false
      t.text :summary
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_operational_checkpoints, [ :ib_operational_record_id, :position ], name: "idx_ib_operational_checkpoints_position"

    create_table :ib_standards_cycles do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :academic_year, foreign_key: true
      t.references :coordinator, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.string :status, null: false, default: "open"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    create_table :ib_standards_packets do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.references :ib_standards_cycle, null: false, foreign_key: true
      t.references :owner, foreign_key: { to_table: :users }
      t.string :code, null: false
      t.string :title, null: false
      t.string :review_state, null: false, default: "draft"
      t.string :evidence_strength, null: false, default: "emerging"
      t.string :export_status, null: false, default: "not_ready"
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_standards_packets, [ :ib_standards_cycle_id, :code ], unique: true, name: "idx_ib_standards_packets_cycle_code"

    create_table :ib_standards_packet_items do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_standards_packet, null: false, foreign_key: true
      t.string :source_type, null: false
      t.bigint :source_id, null: false
      t.string :review_state, null: false, default: "draft"
      t.text :summary
      t.text :relevance_note
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_standards_packet_items, [ :ib_standards_packet_id, :source_type, :source_id ], unique: true, name: "idx_ib_standards_packet_items_source"

    create_table :ib_programme_settings do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, foreign_key: true
      t.references :updated_by, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "Mixed"
      t.string :cadence_mode, null: false, default: "weekly_digest"
      t.string :review_owner_role, null: false, default: "curriculum_lead"
      t.jsonb :thresholds, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :ib_programme_settings, [ :tenant_id, :school_id, :programme ], unique: true, name: "idx_ib_programme_settings_scope"
  end
end
