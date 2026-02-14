class AddPerformanceIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :approvals, [ :tenant_id, :status ], name: "idx_approvals_tenant_status" unless index_exists?(:approvals, [ :tenant_id, :status ])
    add_index :templates, [ :tenant_id, :status ], name: "idx_templates_tenant_status" unless index_exists?(:templates, [ :tenant_id, :status ])
    add_index :standards, [ :standard_framework_id, :code ], unique: true, name: "idx_standards_framework_code" unless index_exists?(:standards, [ :standard_framework_id, :code ])
    add_index :lesson_plans, [ :unit_plan_id, :position ], name: "idx_lesson_plans_unit_position" unless index_exists?(:lesson_plans, [ :unit_plan_id, :position ])
    add_index :lesson_plans, :current_version_id, name: "idx_lesson_plans_current_version" unless index_exists?(:lesson_plans, :current_version_id)
  end
end
