class CreateAnalyticsMaterializedViews < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      CREATE MATERIALIZED VIEW IF NOT EXISTS tenant_daily_stats AS
      SELECT
        tenants.id AS tenant_id,
        DATE(submissions.submitted_at) AS stat_date,
        COUNT(DISTINCT submissions.user_id) AS active_students,
        COUNT(submissions.id) AS submissions_count,
        COUNT(DISTINCT CASE WHEN submissions.grade IS NOT NULL THEN submissions.id END) AS graded_count
      FROM tenants
      LEFT JOIN assignments ON assignments.tenant_id = tenants.id
      LEFT JOIN submissions ON submissions.assignment_id = assignments.id
        AND submissions.submitted_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY tenants.id, DATE(submissions.submitted_at)
      WITH DATA;
    SQL

    execute <<~SQL
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_daily_stats_unique
        ON tenant_daily_stats (tenant_id, stat_date);
    SQL
    execute <<~SQL
      CREATE INDEX IF NOT EXISTS idx_tenant_daily_stats_date
        ON tenant_daily_stats (stat_date);
    SQL

    execute <<~SQL
      CREATE MATERIALIZED VIEW IF NOT EXISTS course_engagement_stats AS
      SELECT
        courses.id AS course_id,
        courses.tenant_id,
        COUNT(DISTINCT enrollments.user_id) AS enrolled_students,
        COUNT(DISTINCT submissions.user_id) AS active_students,
        AVG(submissions.grade) AS average_grade,
        COUNT(DISTINCT quiz_attempts.user_id) AS quiz_participants
      FROM courses
      LEFT JOIN sections ON sections.course_id = courses.id
      LEFT JOIN enrollments ON enrollments.section_id = sections.id
      LEFT JOIN assignments ON assignments.course_id = courses.id
      LEFT JOIN submissions ON submissions.assignment_id = assignments.id
      LEFT JOIN quizzes ON quizzes.course_id = courses.id
      LEFT JOIN quiz_attempts ON quiz_attempts.quiz_id = quizzes.id
      GROUP BY courses.id, courses.tenant_id
      WITH DATA;
    SQL

    execute <<~SQL
      CREATE UNIQUE INDEX IF NOT EXISTS idx_course_engagement_unique
        ON course_engagement_stats (course_id);
    SQL
    execute <<~SQL
      CREATE INDEX IF NOT EXISTS idx_course_engagement_tenant
        ON course_engagement_stats (tenant_id);
    SQL
  end

  def down
    execute "DROP MATERIALIZED VIEW IF EXISTS course_engagement_stats;"
    execute "DROP MATERIALIZED VIEW IF EXISTS tenant_daily_stats;"
  end
end
