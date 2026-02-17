require "rails_helper"

RSpec.describe SearchService do
  let(:tenant) { create(:tenant) }

  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:admin)
    user
  end

  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:teacher)
    user
  end

  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant)
    user.add_role(:student)
    user
  end

  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year, name: "Biology Foundations") }
  let(:unshared_course) { create(:course, tenant: tenant, academic_year: academic_year, name: "Biology Honors") }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }

  let!(:assignment) do
    create(
      :assignment,
      tenant: tenant,
      course: course,
      created_by: teacher,
      title: "Teacher Feedback Reflection",
      description: "Use evidence to explain biology concepts",
      status: "published"
    )
  end

  let!(:unit_plan) do
    create(:unit_plan, tenant: tenant, course: course, created_by: teacher, title: "Biology Unit")
  end

  let!(:lesson_plan) do
    create(
      :lesson_plan,
      tenant: tenant,
      unit_plan: unit_plan,
      created_by: teacher,
      title: "Biology Teaching Cells"
    )
  end

  let!(:standard) do
    framework = create(:standard_framework, tenant: tenant, name: "NGSS")
    create(
      :standard,
      tenant: tenant,
      standard_framework: framework,
      code: "SCI-BIO-1",
      description: "Teaching and learning through scientific inquiry"
    )
  end

  let!(:question_bank) do
    create(
      :question_bank,
      tenant: tenant,
      created_by: teacher,
      title: "Biology Item Bank",
      description: "Assessment questions for biology",
      subject: "Science"
    )
  end

  before do
    Current.tenant = tenant
    create(:enrollment, tenant: tenant, user: teacher, section: section, role: "teacher")
    create(:enrollment, tenant: tenant, user: student, section: section, role: "student")
  end

  after do
    Current.tenant = nil
    Current.user = nil
  end

  it "returns relevance-ranked results across searchable types for admins" do
    results = described_class.new.search(query: "biology", user: admin, limit: 20)

    expect(results.map { |result| result[:type] }).to include(
      "course",
      "assignment",
      "unit_plan",
      "lesson_plan",
      "question_bank"
    )

    ranks = results.map { |result| result[:rank] }
    expect(ranks).to eq(ranks.sort.reverse)
  end

  it "supports stemming/prefix matching" do
    results = described_class.new.search(query: "teaching", user: admin, limit: 20)

    expect(results.map { |result| result[:title] }).to include("Teacher Feedback Reflection")
  end

  it "supports filtering by type" do
    results = described_class.new.search(query: "biology", user: admin, types: [ "course" ], limit: 20)

    expect(results).to all(include(type: "course"))
  end

  it "restricts student-only users to student-visible types and policy scopes" do
    results = described_class.new.search(query: "biology", user: student, limit: 20)

    types = results.map { |result| result[:type] }
    expect(types).to all(satisfy { |type| %w[course assignment].include?(type) })
    expect(results.map { |result| result[:id] }).not_to include(unshared_course.id)
  end

  it "returns empty results for short queries" do
    expect(described_class.new.search(query: "a", user: admin)).to eq([])
  end
end
