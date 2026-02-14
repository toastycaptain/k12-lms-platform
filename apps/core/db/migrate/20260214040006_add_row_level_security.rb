class AddRowLevelSecurity < ActiveRecord::Migration[8.1]
  def up
    tenant_scoped_tables = %w[
      academic_years ai_invocations ai_provider_configs ai_task_policies ai_templates
      announcements approvals assignments attempt_answers course_modules courses
      discussion_posts discussions enrollments integration_configs lesson_plans
      lesson_versions module_items question_banks questions quiz_accommodations
      quiz_attempts quiz_items quizzes resource_links roles rubric_criteria
      rubric_ratings rubric_scores rubrics schools sections standard_frameworks
      standards submissions sync_logs sync_mappings sync_runs template_version_standards
      template_versions templates terms unit_plans unit_version_standards unit_versions
      user_roles users lti_registrations lti_resource_links audit_logs data_retention_policies
    ]

    tenant_scoped_tables.each do |table|
      execute <<-SQL
        ALTER TABLE #{table} ENABLE ROW LEVEL SECURITY;
        CREATE POLICY tenant_isolation_#{table} ON #{table}
          USING (tenant_id = current_setting('app.current_tenant_id', true)::bigint);
      SQL
    end
  end

  def down
    tenant_scoped_tables = %w[
      academic_years ai_invocations ai_provider_configs ai_task_policies ai_templates
      announcements approvals assignments attempt_answers course_modules courses
      discussion_posts discussions enrollments integration_configs lesson_plans
      lesson_versions module_items question_banks questions quiz_accommodations
      quiz_attempts quiz_items quizzes resource_links roles rubric_criteria
      rubric_ratings rubric_scores rubrics schools sections standard_frameworks
      standards submissions sync_logs sync_mappings sync_runs template_version_standards
      template_versions templates terms unit_plans unit_version_standards unit_versions
      user_roles users lti_registrations lti_resource_links audit_logs data_retention_policies
    ]

    tenant_scoped_tables.each do |table|
      execute <<-SQL
        DROP POLICY IF EXISTS tenant_isolation_#{table} ON #{table};
        ALTER TABLE #{table} DISABLE ROW LEVEL SECURITY;
      SQL
    end
  end
end
