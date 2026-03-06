class AddPhase5EvidenceIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :ib_evidence_items, [ :school_id, :programme, :visibility ], name: "idx_ib_evidence_items_programme_visibility"
    add_index :ib_evidence_items, [ :school_id, :created_by_id, :updated_at ], name: "idx_ib_evidence_items_creator_updated"
    add_index :ib_evidence_items, [ :school_id, :planning_context_id, :updated_at ], name: "idx_ib_evidence_items_context_updated"
    add_index :ib_learning_stories, [ :school_id, :programme, :updated_at ], name: "idx_ib_learning_stories_programme_updated"
    add_index :ib_publishing_queue_items, [ :school_id, :updated_at ], name: "idx_ib_publishing_queue_items_updated"
  end
end
