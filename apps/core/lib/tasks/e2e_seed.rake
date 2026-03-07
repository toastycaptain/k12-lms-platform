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

    school = School.find_or_create_by!(tenant: tenant, name: "E2E High School") do |record|
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
    guardian = ensure_user!(
      tenant: tenant,
      email: "guardian@e2e.local",
      first_name: "E2E",
      last_name: "Guardian",
      role: :guardian,
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
      record.school = school
    end
    course.update!(academic_year: academic_year, school: school) if course.academic_year_id != academic_year.id || course.school_id != school.id

    section = Section.find_or_create_by!(tenant: tenant, course: course, name: "E2E Section A") do |record|
      record.term = term
    end

    Enrollment.find_or_create_by!(tenant: tenant, section: section, user: teacher) do |record|
      record.role = "teacher"
    end
    Enrollment.find_or_create_by!(tenant: tenant, section: section, user: student) do |record|
      record.role = "student"
    end
    GuardianLink.find_or_create_by!(tenant: tenant, guardian: guardian, student: student) do |record|
      record.relationship = "parent"
      record.status = "active"
    end

    FeatureFlag::IB_PHASE6_REQUIRED_FLAGS.each do |key|
      FeatureFlag.find_or_create_by!(tenant: tenant, key: key) do |record|
        record.enabled = true
      end
    end
    FeatureFlag.find_or_create_by!(tenant: tenant, key: "guardian_portal_enabled") do |record|
      record.enabled = true
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
        essential_questions: [ "How do ecosystems stay balanced?" ],
        enduring_understandings: [ "Ecosystems are dynamic systems with interdependent species." ],
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

    planning_context = PlanningContext.find_or_create_by!(tenant: tenant, school: school, academic_year: academic_year, name: "Grade 5 PYP") do |record|
      record.created_by = admin
      record.kind = "programme_scope"
      record.settings = {}
    end

    IbProgrammeSetting.find_or_create_by!(tenant: tenant, school: planning_context.school, programme: "PYP") do |record|
      record.updated_by = admin
      record.cadence_mode = "weekly_digest"
      record.review_owner_role = "curriculum_lead"
      record.thresholds = IbProgrammeSetting::DEFAULT_THRESHOLDS
      record.metadata = {}
    end

    pyp_document = CurriculumDocument.find_or_create_by!(
      tenant: tenant,
      school: planning_context.school,
      academic_year: academic_year,
      planning_context: planning_context,
      title: "E2E Water Systems Unit"
    ) do |record|
      record.created_by = teacher
      record.document_type = "ib_pyp_unit"
      record.status = "draft"
      record.pack_key = "ib_continuum_v1"
      record.pack_version = "2026.2"
      record.schema_key = "ib.pyp.unit@v2"
      record.settings = {}
      record.metadata = {}
    end
    if pyp_document.current_version.nil?
      pyp_document.create_version!(
        title: pyp_document.title,
        content: { "overview" => "Students investigate how systems change over time." },
        created_by: teacher,
      )
    end

    dp_document = CurriculumDocument.find_or_create_by!(
      tenant: tenant,
      school: planning_context.school,
      academic_year: academic_year,
      planning_context: planning_context,
      title: "E2E DP Biology Course Map"
    ) do |record|
      record.created_by = teacher
      record.document_type = "ib_dp_course_map"
      record.status = "draft"
      record.pack_key = "ib_continuum_v1"
      record.pack_version = "2026.2"
      record.schema_key = "ib.dp.course_map@v2"
      record.settings = {}
      record.metadata = {}
    end
    if dp_document.current_version.nil?
      dp_document.create_version!(
        title: dp_document.title,
        content: { "overview" => "Semester map for DP Biology." },
        created_by: teacher,
      )
    end

    poi_board = PypProgrammeOfInquiry.find_or_create_by!(
      tenant: tenant,
      school: planning_context.school,
      academic_year: academic_year,
      title: "E2E Programme of Inquiry"
    ) do |record|
      record.coordinator = admin
      record.status = "draft"
    end
    poi_board.entries.find_or_create_by!(tenant: tenant, year_level: "Grade 5", theme: "How the world works") do |record|
      record.title = "Water systems"
      record.central_idea = "Systems respond to change."
      record.review_state = "approved"
      record.coherence_signal = "healthy"
      record.planning_context = planning_context
      record.curriculum_document = pyp_document
    end

    evidence_item = IbEvidenceItem.find_or_create_by!(
      tenant: tenant,
      school: planning_context.school,
      planning_context: planning_context,
      created_by: teacher,
      title: "E2E Observation"
    ) do |record|
      record.student = student
      record.programme = "PYP"
      record.status = "needs_validation"
      record.visibility = "family_ready"
      record.summary = "Student explained how irrigation changes communities."
      record.next_action = "Validate for family story."
      record.story_draft = "A calm family-facing reflection."
      record.metadata = { "linked_story_count" => 0 }
    end
    evidence_item.update!(visibility: "family_ready")

    story = IbLearningStory.find_or_create_by!(
      tenant: tenant,
      school: planning_context.school,
      planning_context: planning_context,
      created_by: teacher,
      title: "E2E Family Story"
    ) do |record|
      record.programme = "PYP"
      record.state = "published"
      record.cadence = "weekly_digest"
      record.audience = "families"
      record.summary = "Families get a concise story about systems thinking."
      record.support_prompt = "Ask how water systems changed during the inquiry."
      record.curriculum_document = pyp_document
      record.metadata = {}
      record.published_at = Time.zone.now
    end
    story.update!(state: "published", published_at: story.published_at || Time.zone.now)
    IbLearningStoryEvidenceItem.find_or_create_by!(tenant: tenant, ib_learning_story: story, ib_evidence_item: evidence_item)
    evidence_item.update!(metadata: evidence_item.metadata.merge("linked_story_count" => 1))

    publishing_queue_item = IbPublishingQueueItem.find_or_create_by!(
      tenant: tenant,
      school: planning_context.school,
      ib_learning_story: story,
      created_by: teacher
    ) do |record|
      record.state = "published"
      record.metadata = {}
      record.delivered_at = Time.zone.now
    end
    publishing_queue_item.update!(state: "published", delivered_at: publishing_queue_item.delivered_at || Time.zone.now)

    operational_record = IbOperationalRecord.find_or_create_by!(
      tenant: tenant,
      school: planning_context.school,
      title: "E2E DP risk review"
    ) do |record|
      record.planning_context = planning_context
      record.curriculum_document = dp_document
      record.owner = admin
      record.programme = "DP"
      record.record_family = "dp_core"
      record.subtype = "coordinator_risk"
      record.status = "draft"
      record.priority = "high"
      record.risk_level = "watch"
      record.due_on = 1.week.from_now.to_date
      record.summary = "A seeded coordinator risk item for smoke coverage."
      record.next_action = "Confirm course-map pacing."
      record.route_hint = "/ib/dp/coordinator"
      record.metadata = { "seeded_by_id" => admin.id, "guardian_visible" => true, "guardian_prompt" => "Review the next biology milestone together." }
    end
    operational_record.update!(
      planning_context: planning_context,
      curriculum_document: dp_document,
      owner: admin,
      programme: "DP",
      record_family: "dp_core",
      subtype: "coordinator_risk",
      status: "draft",
      priority: "high",
      risk_level: "watch",
      due_on: operational_record.due_on || 1.week.from_now.to_date,
      next_action: "Confirm course-map pacing.",
      route_hint: "/ib/dp/coordinator",
      metadata: operational_record.metadata.merge(
        "seeded_by_id" => admin.id,
        "guardian_visible" => true,
        "guardian_prompt" => "Review the next biology milestone together."
      )
    )

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
        { key: "C", text: "Nucleus" }
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
    puts "  Guardian: #{guardian.email}"
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
