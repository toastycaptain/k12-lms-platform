class AddPerformanceIndexes < ActiveRecord::Migration[7.2]
  def change
    # M2: Approvals filtered by status
    add_index :approvals, [:tenant_id, :status], name: "idx_approvals_tenant_status"

    # M2: Templates filtered by status
    add_index :templates, [:tenant_id, :status], name: "idx_templates_tenant_status"

    # M2: Standards tree queries
    add_index :standards, [:standard_framework_id, :parent_id], name: "idx_standards_framework_parent"

    # M3: Assignments filtered by status within course
    add_index :assignments, [:course_id, :status], name: "idx_assignments_course_status"

    # M3: Submissions filtered by status within assignment
    add_index :submissions, [:assignment_id, :status], name: "idx_submissions_assignment_status"

    # M3: Announcements ordered by pinned + published_at
    add_index :announcements, [:course_id, :pinned, :published_at], name: "idx_announcements_course_pinned_pub"

    # M4: Question banks filtered by subject
    add_index :question_banks, [:tenant_id, :subject], name: "idx_question_banks_tenant_subject"

    # M4: Quizzes filtered by status within course
    add_index :quizzes, [:course_id, :status], name: "idx_quizzes_course_status"

    # M5: Resource links by drive_file_id
    add_index :resource_links, :drive_file_id, where: "drive_file_id IS NOT NULL", name: "idx_resource_links_drive_file_id"

    # M7: LTI registrations by client_id
    add_index :lti_registrations, [:tenant_id, :client_id], name: "idx_lti_registrations_tenant_client"

    # M7: Audit logs by action and date
    add_index :audit_logs, [:tenant_id, :action, :created_at], name: "idx_audit_logs_tenant_action_date"

    # M7: Sync runs by type and date
    add_index :sync_runs, [:integration_config_id, :sync_type, :created_at], name: "idx_sync_runs_config_type_date"

    # M7: Sync logs by level within run
    add_index :sync_logs, [:sync_run_id, :level], name: "idx_sync_logs_run_level"

    # M1: Unit plans by status within tenant
    add_index :unit_plans, [:tenant_id, :status], name: "idx_unit_plans_tenant_status"

    # M1: Lesson plans ordered by position within unit
    add_index :lesson_plans, [:unit_plan_id, :position], name: "idx_lesson_plans_unit_position"
  end
end
