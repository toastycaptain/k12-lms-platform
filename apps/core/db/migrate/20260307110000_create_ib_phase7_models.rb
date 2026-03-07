class CreateIbPhase7Models < ActiveRecord::Migration[8.1]
  def change
    create_table :ib_activity_events do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.string :event_name, null: false
      t.string :event_family, null: false
      t.string :surface, null: false
      t.string :programme, null: false, default: "Mixed"
      t.string :route_id
      t.string :entity_ref
      t.string :document_type
      t.string :session_key
      t.string :dedupe_key
      t.jsonb :metadata, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.timestamps
    end

    add_index :ib_activity_events, [ :tenant_id, :event_name, :occurred_at ], name: :idx_ib_activity_events_event_time
    add_index :ib_activity_events, [ :tenant_id, :event_family, :programme, :occurred_at ], name: :idx_ib_activity_events_family_programme
    add_index :ib_activity_events, [ :user_id, :occurred_at ], name: :idx_ib_activity_events_user_time
    add_index :ib_activity_events, [ :tenant_id, :dedupe_key ], unique: true, where: "dedupe_key IS NOT NULL", name: :idx_ib_activity_events_dedupe

    create_table :ib_user_workspace_preferences do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :surface, null: false
      t.string :context_key, null: false
      t.string :preference_key, null: false
      t.string :scope_key, null: false, default: "global"
      t.jsonb :value, null: false, default: {}
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :ib_user_workspace_preferences,
      [ :tenant_id, :user_id, :surface, :context_key, :preference_key, :scope_key ],
      unique: true,
      name: :idx_ib_workspace_preferences_scope

    create_table :ib_specialist_library_items do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.string :programme, null: false, default: "Mixed"
      t.string :item_type, null: false, default: "resource"
      t.string :title, null: false
      t.text :summary
      t.jsonb :content, null: false, default: {}
      t.jsonb :tags, null: false, default: []
      t.string :source_entity_ref
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :ib_specialist_library_items, [ :tenant_id, :school_id, :programme ], name: :idx_ib_specialist_library_scope

    create_table :ib_portfolio_collections do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :school, null: true, foreign_key: true
      t.references :student, null: false, foreign_key: { to_table: :users }
      t.references :created_by, null: true, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :narrative_summary
      t.string :visibility, null: false, default: "private"
      t.string :shared_token
      t.jsonb :filters, null: false, default: {}
      t.jsonb :item_refs, null: false, default: []
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :ib_portfolio_collections, [ :tenant_id, :student_id, :title ], name: :idx_ib_portfolio_collections_student_title
    add_index :ib_portfolio_collections, :shared_token, unique: true

    create_table :ib_learning_story_translations do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :ib_learning_story, null: false, foreign_key: true
      t.references :translated_by, null: true, foreign_key: { to_table: :users }
      t.string :locale, null: false
      t.string :state, null: false, default: "draft"
      t.text :translated_title
      t.text :translated_summary
      t.text :translated_support_prompt
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :ib_learning_story_translations, [ :ib_learning_story_id, :locale ], unique: true, name: :idx_ib_story_translations_story_locale
  end
end
