class OnboardingChecklistService
  def initialize(tenant)
    @tenant = tenant
  end

  def call
    items = checklist_items
    completed = items.count { |item| item[:done] }
    total = items.length

    {
      tenant_id: @tenant.id,
      school_name: @tenant.name,
      completion_percentage: total.zero? ? 0 : ((completed.to_f / total) * 100).round,
      completed_count: completed,
      total_count: total,
      items: items
    }
  end

  private

  def checklist_items
    Current.tenant = @tenant
    [
      { key: "admin_created", label: "Admin account created", done: admin_exists?, required: true },
      { key: "school_configured", label: "School settings configured", done: school_configured?, required: true },
      { key: "academic_year", label: "Academic year and terms set up", done: academic_year_exists?, required: true },
      { key: "teachers_added", label: "At least one teacher added", done: teachers_exist?, required: true },
      { key: "students_added", label: "Students enrolled", done: students_exist?, required: false },
      { key: "course_created", label: "At least one course created", done: courses_exist?, required: false },
      { key: "standards_imported", label: "Standards imported", done: standards_exist?, required: false },
      { key: "google_configured", label: "Google integration configured", done: google_configured?, required: false },
      { key: "ai_configured", label: "AI policies configured", done: ai_configured?, required: true },
      { key: "branding_set", label: "School branding customized", done: branding_set?, required: false }
    ]
  ensure
    Current.tenant = nil
  end

  def admin_exists?
    User.joins(:roles).where(roles: { name: "admin" }).exists?
  end

  def school_configured?
    @tenant.schools.exists?
  end

  def academic_year_exists?
    AcademicYear.exists?
  end

  def teachers_exist?
    User.joins(:roles).where(roles: { name: "teacher" }).exists?
  end

  def students_exist?
    User.joins(:roles).where(roles: { name: "student" }).exists?
  end

  def courses_exist?
    Course.exists?
  end

  def standards_exist?
    Standard.exists?
  rescue NameError
    false
  end

  def google_configured?
    @tenant.settings.dig("features", "google_integration") == true
  end

  def ai_configured?
    AiTaskPolicy.exists?
  end

  def branding_set?
    branding = @tenant.settings.fetch("branding", {})
    branding["logo_url"].present?
  end
end
