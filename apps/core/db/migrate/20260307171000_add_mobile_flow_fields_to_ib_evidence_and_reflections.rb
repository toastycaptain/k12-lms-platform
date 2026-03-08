class AddMobileFlowFieldsToIbEvidenceAndReflections < ActiveRecord::Migration[8.1]
  def change
    add_reference :ib_evidence_items, :ib_operational_record, foreign_key: true
    add_index :ib_evidence_items, [ :tenant_id, :ib_operational_record_id ], name: :idx_ib_evidence_items_operational_record

    add_reference :ib_reflection_requests, :approved_by, foreign_key: { to_table: :users }
    add_column :ib_reflection_requests, :approved_at, :datetime
    add_index :ib_reflection_requests, [ :tenant_id, :status, :approved_at ], name: :idx_ib_reflection_requests_mobile_review
  end
end
