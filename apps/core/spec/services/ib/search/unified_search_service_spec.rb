require "rails_helper"

RSpec.describe Ib::Search::UnifiedSearchService do
  let(:tenant) { create(:tenant) }
  let(:school) { create(:school, tenant: tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:admin) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Alex", last_name: "Admin")
    user.add_role(:admin)
    Current.tenant = nil
    user
  end
  let(:teacher) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Taylor", last_name: "Teacher")
    user.add_role(:teacher)
    Current.tenant = nil
    user
  end
  let(:student) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Sam", last_name: "Student")
    user.add_role(:student)
    Current.tenant = nil
    user
  end
  let(:guardian) do
    Current.tenant = tenant
    user = create(:user, tenant: tenant, first_name: "Grace", last_name: "Guardian")
    user.add_role(:guardian)
    Current.tenant = nil
    user
  end
  let(:planning_context) do
    create(
      :planning_context,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      created_by: admin,
      name: "Grade 5 Inquiry"
    )
  end
  let(:course) { create(:course, tenant: tenant, school: school, academic_year: academic_year, name: "Inquiry course") }
  let(:term) { create(:term, tenant: tenant, academic_year: academic_year) }
  let(:section) { create(:section, tenant: tenant, course: course, term: term) }
  let!(:teacher_enrollment) { create(:enrollment, tenant: tenant, section: section, user: teacher, role: "teacher") }
  let!(:student_enrollment) { create(:enrollment, tenant: tenant, section: section, user: student, role: "student") }
  let!(:guardian_link) { create(:guardian_link, tenant: tenant, guardian: guardian, student: student) }
  let!(:document) do
    create(
      :curriculum_document,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      planning_context: planning_context,
      created_by: admin,
      document_type: "ib_pyp_unit",
      title: "How we organize ourselves",
      pack_key: "ib_continuum_v1",
      pack_version: "2026.2",
      schema_key: "ib.pyp.unit@v2"
    )
  end
  let!(:document_version) do
    version = create(
      :curriculum_document_version,
      curriculum_document: document,
      tenant: tenant,
      created_by: admin,
      title: document.title,
      content: {
        "central_idea" => "Systems shape communities through reflection.",
        "learning_experiences" => [ { "title" => "Provocation", "detail" => "Observe a visible system." } ]
      }
    )
    document.update!(current_version_id: version.id)
    version
  end
  let!(:evidence_item) do
    create(
      :ib_evidence_item,
      tenant: tenant,
      school: school,
      planning_context: planning_context,
      curriculum_document: document,
      student: student,
      created_by: admin,
      programme: "PYP",
      title: "Reflection capture",
      summary: "Reflection linked to organizing systems.",
      visibility: "guardian_visible",
      metadata: { "atl_tags" => [ "research" ], "learner_profile" => [ "reflective" ] }
    )
  end
  let!(:reflection_request) do
    create(
      :ib_reflection_request,
      tenant: tenant,
      ib_evidence_item: evidence_item,
      requested_by: admin,
      student: student,
      prompt: "Capture your next reflection about systems."
    )
  end
  let!(:task_comment) do
    create(
      :ib_document_comment,
      tenant: tenant,
      curriculum_document: document,
      author: admin,
      comment_type: "task",
      body: "Task: align the next reflection prompt.",
      visibility: "internal"
    )
  end
  let!(:report) do
    create(
      :ib_report,
      tenant: tenant,
      school: school,
      academic_year: academic_year,
      student: student,
      author: admin,
      audience: "guardian",
      programme: "PYP",
      title: "PYP progress snapshot",
      summary: "Family-facing reflection progress summary."
    )
  end

  before do
    create(:planning_context_course, tenant: tenant, planning_context: planning_context, course: course)
    Current.tenant = tenant
    Current.school = school
  end

  after do
    Current.tenant = nil
    Current.user = nil
    Current.school = nil if Current.respond_to?(:school=)
  end

  it "returns teacher-visible documents and task comments from the linked planning context" do
    payload = described_class.new(user: teacher, school: school, tenant: tenant).search_payload(
      query: "reflection"
    )

    kinds = payload.fetch(:results).map { |row| row[:kind] }
    expect(payload.dig(:query_language, :tokens)).to include("reflection")
    expect(kinds).to include("document", "task")
    expect(payload.fetch(:concept_graph)).not_to be_empty
  end

  it "filters guardian results down to linked student work and hides internal collaboration" do
    payload = described_class.new(user: guardian, school: school, tenant: tenant).search_payload(
      query: "reflection"
    )

    kinds = payload.fetch(:results).map { |row| row[:kind] }
    expect(kinds).to include("evidence", "reflection", "report")
    expect(kinds).not_to include("task", "comment", "document")
    expect(payload.fetch(:student_journey).map { |row| row[:kind] }).to include("evidence")
  end

  it "parses filters and keeps grouped results aligned with applied filters" do
    payload = described_class.new(user: admin, school: school, tenant: tenant).search_payload(
      query: 'kind:reflection programme:PYP "next reflection"',
      filters: { "status" => [ "requested" ] }
    )

    expect(payload.dig(:query_language, :applied_filters)).to include(
      "kind" => [ "reflection" ],
      "programme" => [ "PYP" ],
      "status" => [ "requested" ]
    )
    expect(payload.fetch(:grouped_results).map { |group| group[:key] }).to eq([ "reflection" ])
    expect(payload.dig(:freshness, :index_strategy)).to eq("database_scoped_search_v3")
  end
end
