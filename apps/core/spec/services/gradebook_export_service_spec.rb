require "rails_helper"

RSpec.describe GradebookExportService do
  let(:tenant) { create(:tenant) }
  let(:academic_year) { create(:academic_year, tenant: tenant) }
  let(:course) { create(:course, tenant: tenant, academic_year: academic_year) }

  let(:payload) do
    {
      students: [
        {
          id: 1,
          name: "Sam Student",
          email: "sam@example.com",
          grades: [
            {
              assignment_id: 10,
              grade: 95.0,
              late: false,
              missing: false
            },
            {
              assignment_id: 11,
              grade: nil,
              late: false,
              missing: true
            }
          ],
          course_average: 95.0,
          missing_count: 1,
          late_count: 0,
          mastery: {
            percentage: 100.0,
            mastered_standards: 2,
            total_standards: 2
          }
        },
        {
          id: 2,
          name: "Pat Learner",
          email: "pat@example.com",
          grades: [
            {
              assignment_id: 10,
              grade: 72.0,
              late: true,
              missing: false
            },
            {
              assignment_id: 11,
              grade: 80.0,
              late: false,
              missing: false
            }
          ],
          course_average: 76.0,
          missing_count: 0,
          late_count: 1,
          mastery: nil
        }
      ],
      assignments: [
        { id: 10, title: "Unit Reflection", average: 83.5 },
        { id: 11, title: "Cell Quiz Review", average: 80.0 }
      ],
      course_summary: {
        overall_average: 85.5,
        students_with_missing_work: 1
      }
    }
  end

  it "builds CSV with headers, student grade cells, indicators, and summary row" do
    csv = described_class.new(course: course, payload: payload).call

    lines = csv.strip.split("\n").map { |line| line.split(",", -1) }

    expect(lines.first).to eq(
      [ "Student Name", "Email", "Unit Reflection", "Cell Quiz Review", "Course Average", "Missing", "Late", "Mastery" ]
    )

    expect(lines[1]).to eq(
      [ "Sam Student", "sam@example.com", "95.0", "MISSING", "95.0%", "1", "0", "100.0% (2/2)" ]
    )

    expect(lines[2]).to eq(
      [ "Pat Learner", "pat@example.com", "72.0 (LATE)", "80.0", "76.0%", "0", "1", "-" ]
    )

    expect(lines.last).to eq(
      [ "Class Average", "", "83.5%", "80.0%", "85.5%", "1", "", "" ]
    )
  end
end
