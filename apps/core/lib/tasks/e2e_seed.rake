namespace :e2e do
  E2E_TENANT_SLUG = "e2e-district"

  def ensure_user!(tenant:, email:, first_name:, last_name:, role:)
    user = User.unscoped.find_or_create_by!(email: email, tenant: tenant) do |record|
      record.first_name = first_name
      record.last_name = last_name
    end
    user.update!(onboarding_complete: true) unless user.onboarding_complete
    user.add_role(role)
    user
  end

  desc "Seed deterministic E2E data for Playwright flows"
  task seed: :environment do
    puts "Seeding E2E fixtures..."

    tenant = Tenant.unscoped.find_or_create_by!(slug: E2E_TENANT_SLUG) do |record|
      record.name = "E2E District"
      record.settings = { timezone: "America/Chicago" }
    end

    Current.tenant = tenant

    School.find_or_create_by!(tenant: tenant, name: "E2E High School") do |record|
      record.address = "100 E2E Ave, Test City, IL 60601"
      record.timezone = "America/Chicago"
    end

    admin = ensure_user!(
      tenant: tenant,
      email: "admin@e2e.local",
      first_name: "E2E",
      last_name: "Admin",
      role: :admin,
    )
    teacher = ensure_user!(
      tenant: tenant,
      email: "teacher@e2e.local",
      first_name: "E2E",
      last_name: "Teacher",
      role: :teacher,
    )
    student = ensure_user!(
      tenant: tenant,
      email: "student@e2e.local",
      first_name: "E2E",
      last_name: "Student",
      role: :student,
    )

    academic_year = AcademicYear.find_or_create_by!(tenant: tenant, name: "2025-2026") do |record|
      record.start_date = Date.new(2025, 8, 1)
      record.end_date = Date.new(2026, 6, 30)
      record.current = true
    end

    term = Term.find_or_create_by!(
      tenant: tenant,
      academic_year: academic_year,
      name: "E2E Fall 2025",
    ) do |record|
      record.start_date = Date.new(2025, 8, 1)
      record.end_date = Date.new(2025, 12, 20)
    end

    course = Course.find_or_create_by!(tenant: tenant, name: "E2E Biology 101") do |record|
      record.code = "E2E-BIO-101"
      record.description = "Seeded biology course for browser E2E tests"
      record.academic_year = academic_year
    end

    section = Section.find_or_create_by!(tenant: tenant, course: course, name: "E2E Section A") do |record|
      record.term = term
    end

    Enrollment.find_or_create_by!(tenant: tenant, section: section, user: teacher) do |record|
      record.role = "teacher"
    end
    Enrollment.find_or_create_by!(tenant: tenant, section: section, user: student) do |record|
      record.role = "student"
    end

    framework = StandardFramework.find_or_create_by!(tenant: tenant, name: "E2E Science Standards") do |record|
      record.jurisdiction = "E2E"
      record.subject = "Science"
      record.version = "v1"
    end

    root_standard = Standard.find_or_create_by!(
      tenant: tenant,
      standard_framework: framework,
      code: "E2E.BIO",
    ) do |record|
      record.description = "E2E biology root standard"
      record.grade_band = "9-12"
    end

    leaf_standard = Standard.find_or_create_by!(
      tenant: tenant,
      standard_framework: framework,
      code: "E2E.BIO.1",
    ) do |record|
      record.parent = root_standard
      record.description = "Explain cell structure and function"
      record.grade_band = "9-12"
    end

    unit = UnitPlan.find_or_create_by!(tenant: tenant, course: course, title: "E2E Ecosystems Unit") do |record|
      record.created_by = teacher
      record.status = "draft"
    end

    if unit.current_version.nil?
      unit.create_version!(
        title: unit.title,
        description: "Students analyze ecosystems and biodiversity.",
        essential_questions: ["How do ecosystems stay balanced?"],
        enduring_understandings: ["Ecosystems are dynamic systems with interdependent species."],
      )
    end

    unit.current_version.standards << leaf_standard unless unit.current_version.standards.exists?(id: leaf_standard.id)

    lesson = LessonPlan.find_or_create_by!(tenant: tenant, unit_plan: unit, title: "E2E Lesson 1") do |record|
      record.created_by = teacher
      record.position = 0
      record.status = "draft"
    end

    if lesson.current_version.nil?
      lesson.create_version!(
        title: lesson.title,
        objectives: "Describe ecosystems and food webs.",
        activities: "Bell-ringer, direct instruction, guided practice, exit ticket",
        materials: "Slides, worksheet",
        duration_minutes: 45,
      )
    end

    question_bank = QuestionBank.find_or_create_by!(tenant: tenant, title: "E2E Biology Question Bank") do |record|
      record.created_by = teacher
      record.description = "Seeded bank for E2E quizzes"
      record.subject = "Science"
      record.grade_level = "9"
      record.status = "active"
    end

    question = Question.find_or_create_by!(
      tenant: tenant,
      question_bank: question_bank,
      prompt: "What organelle is the powerhouse of the cell?",
    ) do |record|
      record.created_by = teacher
      record.question_type = "multiple_choice"
      record.points = 5
      record.status = "active"
      record.choices = [
        { key: "A", text: "Mitochondria" },
        { key: "B", text: "Ribosome" },
        { key: "C", text: "Nucleus" },
      ]
      record.correct_answer = { key: "A" }
      record.explanation = "Mitochondria produce ATP for the cell."
    end

    seeded_quiz = Quiz.find_or_create_by!(tenant: tenant, course: course, title: "E2E Seed Quiz") do |record|
      record.created_by = teacher
      record.description = "Published quiz seeded for E2E checks."
      record.status = "published"
      record.quiz_type = "standard"
      record.show_results = "after_submit"
      record.attempts_allowed = 1
    end

    QuizItem.find_or_create_by!(tenant: tenant, quiz: seeded_quiz, question: question) do |record|
      record.position = 0
      record.points = 5
    end
    seeded_quiz.update!(status: "published") unless seeded_quiz.status == "published"
    seeded_quiz.calculate_points!

    puts "E2E fixtures ready for tenant '#{tenant.slug}'."
    puts "  Admin:   #{admin.email}"
    puts "  Teacher: #{teacher.email}"
    puts "  Student: #{student.email}"
  ensure
    Current.tenant = nil
  end

  desc "Reset mutable E2E records while keeping idempotent fixtures in place"
  task cleanup: :environment do
    tenant = Tenant.unscoped.find_by(slug: E2E_TENANT_SLUG)
    unless tenant
      puts "No E2E tenant found; skipping cleanup."
      next
    end

    Current.tenant = tenant

    QuizAttempt.where(tenant_id: tenant.id).find_each(&:destroy!)
    Submission.where(tenant_id: tenant.id).find_each(&:destroy!)

    puts "E2E mutable data cleared for tenant '#{tenant.slug}'."
  ensure
    Current.tenant = nil
  end
end
