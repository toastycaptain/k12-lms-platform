class AddPerformanceIndexesV2 < ActiveRecord::Migration[8.1]
  def change
    add_index :submissions, [ :user_id, :assignment_id ], name: "idx_submissions_user_assignment", if_not_exists: true
    add_index :enrollments, [ :user_id, :section_id ], name: "idx_enrollments_user_section", if_not_exists: true
    add_index :notifications, [ :user_id, :read_at ], name: "idx_notifications_user_read_at", if_not_exists: true
    add_index :quiz_attempts, [ :user_id, :quiz_id ], name: "idx_quiz_attempts_user_quiz", if_not_exists: true
    add_index :audit_logs, :created_at, name: "idx_audit_logs_created_at", if_not_exists: true
  end
end
