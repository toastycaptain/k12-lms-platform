# Idempotent seed data for development and demos
# Run: bundle exec rails db:seed
# Re-run: bundle exec rails db:seed:replant (drops and re-seeds)

puts "Seeding database..."

# --- Tenant & School ---
tenant = Tenant.find_or_create_by!(slug: "demo-school") do |t|
  t.name = "Demo School District"
  t.settings = { timezone: "America/Chicago" }
end
Current.tenant = tenant

school = School.find_or_create_by!(name: "Lincoln Elementary", tenant: tenant) do |s|
  s.address = "123 Main St, Springfield, IL 62701"
  s.timezone = "America/Chicago"
end

# --- Users ---
admin = User.find_or_create_by!(email: "admin@demo-school.example.com", tenant: tenant) do |u|
  u.first_name = "Alice"
  u.last_name = "Admin"
end
admin.add_role(:admin)

teacher1 = User.find_or_create_by!(email: "teacher1@demo-school.example.com", tenant: tenant) do |u|
  u.first_name = "Bob"
  u.last_name = "Teacher"
end
teacher1.add_role(:teacher)

teacher2 = User.find_or_create_by!(email: "teacher2@demo-school.example.com", tenant: tenant) do |u|
  u.first_name = "Carol"
  u.last_name = "Educator"
end
teacher2.add_role(:teacher)

student1 = User.find_or_create_by!(email: "student1@demo-school.example.com", tenant: tenant) do |u|
  u.first_name = "David"
  u.last_name = "Student"
end
student1.add_role(:student)

student2 = User.find_or_create_by!(email: "student2@demo-school.example.com", tenant: tenant) do |u|
  u.first_name = "Emma"
  u.last_name = "Learner"
end
student2.add_role(:student)

student3 = User.find_or_create_by!(email: "student3@demo-school.example.com", tenant: tenant) do |u|
  u.first_name = "Frank"
  u.last_name = "Scholar"
end
student3.add_role(:student)

puts "  Created #{User.count} users"

# --- Academic Year & Terms ---
academic_year = AcademicYear.find_or_create_by!(name: "2025-2026", tenant: tenant) do |ay|
  ay.start_date = Date.new(2025, 8, 15)
  ay.end_date = Date.new(2026, 6, 1)
  ay.current = true
end

term1 = Term.find_or_create_by!(name: "Fall 2025", tenant: tenant, academic_year: academic_year) do |t|
  t.start_date = Date.new(2025, 8, 15)
  t.end_date = Date.new(2025, 12, 19)
end

term2 = Term.find_or_create_by!(name: "Spring 2026", tenant: tenant, academic_year: academic_year) do |t|
  t.start_date = Date.new(2026, 1, 6)
  t.end_date = Date.new(2026, 6, 1)
end

puts "  Created academic year with #{Term.count} terms"

# --- Courses & Sections ---
math_course = Course.find_or_create_by!(name: "5th Grade Math", tenant: tenant) do |c|
  c.code = "MATH-5"
  c.description = "Fifth grade mathematics covering fractions, decimals, and geometry"
  c.academic_year = academic_year
end

ela_course = Course.find_or_create_by!(name: "5th Grade ELA", tenant: tenant) do |c|
  c.code = "ELA-5"
  c.description = "Fifth grade English Language Arts covering reading, writing, and grammar"
  c.academic_year = academic_year
end

math_section = Section.find_or_create_by!(name: "Math Period 1", tenant: tenant, course: math_course) do |s|
  s.term = term1
end

ela_section = Section.find_or_create_by!(name: "ELA Period 2", tenant: tenant, course: ela_course) do |s|
  s.term = term1
end

# Enrollments
[ [ teacher1, math_section, :teacher ], [ teacher2, ela_section, :teacher ],
  [ student1, math_section, :student ], [ student2, math_section, :student ],
  [ student3, ela_section, :student ], [ student1, ela_section, :student ] ].each do |user, section, role|
  Enrollment.find_or_create_by!(user: user, section: section, tenant: tenant) do |e|
    e.role = role
  end
end

puts "  Created #{Course.count} courses, #{Section.count} sections, #{Enrollment.count} enrollments"

# --- Standard Framework & Standards ---
framework = StandardFramework.find_or_create_by!(name: "Common Core Math", tenant: tenant) do |sf|
  sf.jurisdiction = "National"
  sf.subject = "Mathematics"
  sf.version = "2010"
end

# Root standards (domains)
nbt = Standard.find_or_create_by!(code: "5.NBT", tenant: tenant, standard_framework: framework) do |s|
  s.description = "Number and Operations in Base Ten"
  s.grade_band = "5"
end

nf = Standard.find_or_create_by!(code: "5.NF", tenant: tenant, standard_framework: framework) do |s|
  s.description = "Number and Operations — Fractions"
  s.grade_band = "5"
end

geo = Standard.find_or_create_by!(code: "5.G", tenant: tenant, standard_framework: framework) do |s|
  s.description = "Geometry"
  s.grade_band = "5"
end

# Child standards
Standard.find_or_create_by!(code: "5.NBT.1", tenant: tenant, standard_framework: framework, parent: nbt) do |s|
  s.description = "Recognize that in a multi-digit number, a digit in one place represents 10 times as much."
  s.grade_band = "5"
end

Standard.find_or_create_by!(code: "5.NBT.2", tenant: tenant, standard_framework: framework, parent: nbt) do |s|
  s.description = "Explain patterns in the number of zeros of the product when multiplying."
  s.grade_band = "5"
end

Standard.find_or_create_by!(code: "5.NBT.5", tenant: tenant, standard_framework: framework, parent: nbt) do |s|
  s.description = "Fluently multiply multi-digit whole numbers."
  s.grade_band = "5"
end

Standard.find_or_create_by!(code: "5.NF.1", tenant: tenant, standard_framework: framework, parent: nf) do |s|
  s.description = "Add and subtract fractions with unlike denominators."
  s.grade_band = "5"
end

Standard.find_or_create_by!(code: "5.NF.3", tenant: tenant, standard_framework: framework, parent: nf) do |s|
  s.description = "Interpret a fraction as division of the numerator by the denominator."
  s.grade_band = "5"
end

Standard.find_or_create_by!(code: "5.G.1", tenant: tenant, standard_framework: framework, parent: geo) do |s|
  s.description = "Use a pair of perpendicular number lines to define a coordinate system."
  s.grade_band = "5"
end

Standard.find_or_create_by!(code: "5.G.3", tenant: tenant, standard_framework: framework, parent: geo) do |s|
  s.description = "Understand that attributes belonging to a category of figures also belong to all subcategories."
  s.grade_band = "5"
end

puts "  Created #{StandardFramework.count} framework with #{Standard.count} standards"

# --- Unit Plans with Versions, Lessons, and Resources ---

# Unit Plan 1: Fractions
fractions_unit = UnitPlan.find_or_create_by!(title: "Understanding Fractions", tenant: tenant, course: math_course) do |up|
  up.created_by = teacher1
  up.status = "published"
end

unless fractions_unit.current_version
  v1 = fractions_unit.create_version!(
    title: "Understanding Fractions",
    description: "Students will develop a deep understanding of fractions, including addition, subtraction, and interpreting fractions as division.",
    essential_questions: [
      "What does a fraction represent?",
      "How do we add and subtract fractions with different denominators?"
    ],
    enduring_understandings: [
      "Fractions represent parts of a whole and can be used to model real-world situations.",
      "Finding common denominators is the key to adding and subtracting fractions."
    ]
  )

  # Add lesson plans
  lesson1 = LessonPlan.find_or_create_by!(title: "Introduction to Fractions", tenant: tenant, unit_plan: fractions_unit) do |lp|
    lp.created_by = teacher1
    lp.position = 0
    lp.status = "draft"
  end
  lesson1.create_version!(
    title: "Introduction to Fractions",
    objectives: "Students will identify and name fractions using visual models.",
    activities: "1. Warm-up: fraction wall activity\n2. Direct instruction: fraction notation\n3. Practice: identify fractions from images\n4. Exit ticket",
    materials: "Fraction wall poster, fraction cards, worksheet",
    duration_minutes: 45
  )

  lesson2 = LessonPlan.find_or_create_by!(title: "Adding Fractions", tenant: tenant, unit_plan: fractions_unit) do |lp|
    lp.created_by = teacher1
    lp.position = 1
    lp.status = "draft"
  end
  lesson2.create_version!(
    title: "Adding Fractions",
    objectives: "Students will add fractions with unlike denominators by finding common denominators.",
    activities: "1. Review: equivalent fractions\n2. Guided practice: finding LCM\n3. Independent practice: adding fractions\n4. Partner check",
    materials: "Whiteboard, fraction strips, practice workbook",
    duration_minutes: 50
  )

  # Resource links
  ResourceLink.find_or_create_by!(
    url: "https://drive.google.com/file/d/fraction-worksheet-1",
    tenant: tenant,
    linkable: v1
  ) do |rl|
    rl.title = "Fraction Worksheet Pack"
    rl.provider = "google_drive"
    rl.drive_file_id = "fraction-worksheet-1"
    rl.mime_type = "application/pdf"
  end
end

# Unit Plan 2: Geometry
geometry_unit = UnitPlan.find_or_create_by!(title: "Exploring Geometry", tenant: tenant, course: math_course) do |up|
  up.created_by = teacher1
  up.status = "draft"
end

unless geometry_unit.current_version
  geometry_unit.create_version!(
    title: "Exploring Geometry",
    description: "Students explore coordinate planes, 2D shapes, and their properties.",
    essential_questions: [
      "How do we use coordinates to describe locations?",
      "What properties define different categories of shapes?"
    ],
    enduring_understandings: [
      "The coordinate plane is a tool for precisely describing locations in space.",
      "Shapes can be classified by their properties, and properties of a category apply to all subcategories."
    ]
  )

  lesson3 = LessonPlan.find_or_create_by!(title: "The Coordinate Plane", tenant: tenant, unit_plan: geometry_unit) do |lp|
    lp.created_by = teacher1
    lp.position = 0
    lp.status = "draft"
  end
  lesson3.create_version!(
    title: "The Coordinate Plane",
    objectives: "Students will plot and identify points on the coordinate plane using ordered pairs.",
    activities: "1. Intro: real-world maps as coordinate systems\n2. Teacher demo: plotting points\n3. Practice: treasure hunt on coordinate grid\n4. Reflection journal",
    materials: "Graph paper, coordinate grid poster, treasure hunt cards",
    duration_minutes: 45
  )
end

puts "  Created #{UnitPlan.count} unit plans with #{LessonPlan.count} lessons and #{ResourceLink.count} resource links"

begin
  load Rails.root.join("db/seeds/alert_defaults.rb")
  puts "  Seeded alert defaults"
rescue NameError, ActiveRecord::StatementInvalid => e
  puts "  Skipping alert defaults: #{e.class} #{e.message}"
end

Current.tenant = nil
puts "Seeding complete!"
