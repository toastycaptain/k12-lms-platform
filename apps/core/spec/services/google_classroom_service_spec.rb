require "rails_helper"

RSpec.describe GoogleClassroomService do
  let!(:tenant) { create(:tenant) }
  let(:user) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant,
      google_access_token: "valid-token",
      google_refresh_token: "refresh-token",
      google_token_expires_at: 1.hour.from_now)
    Current.tenant = nil
    u
  end

  let(:mock_classroom_service) { instance_double(Google::Apis::ClassroomV1::ClassroomService) }
  let(:mock_authorization) { instance_double(Google::Auth::UserRefreshCredentials, "access_token=": nil, "refresh_token=": nil) }
  let(:service) { described_class.new(user) }

  before do
    allow(Google::Apis::ClassroomV1::ClassroomService).to receive(:new).and_return(mock_classroom_service)
    allow(mock_classroom_service).to receive(:authorization=)
    allow(mock_classroom_service).to receive(:authorization).and_return(mock_authorization)
  end

  describe "#list_courses" do
    it "returns active courses" do
      course = Google::Apis::ClassroomV1::Course.new(id: "123", name: "Math 101")
      response = Google::Apis::ClassroomV1::ListCoursesResponse.new(courses: [ course ])
      allow(mock_classroom_service).to receive(:list_courses)
        .with(teacher_id: "me", course_states: [ "ACTIVE" ])
        .and_return(response)

      result = service.list_courses
      expect(result.length).to eq(1)
      expect(result.first.name).to eq("Math 101")
    end

    it "returns empty array when no courses" do
      response = Google::Apis::ClassroomV1::ListCoursesResponse.new(courses: nil)
      allow(mock_classroom_service).to receive(:list_courses).and_return(response)

      expect(service.list_courses).to eq([])
    end

    it "wraps Google API errors in GoogleApiError" do
      allow(mock_classroom_service).to receive(:list_courses)
        .and_raise(Google::Apis::ClientError.new("Forbidden", status_code: 403))

      expect { service.list_courses }.to raise_error(GoogleApiError) do |error|
        expect(error.message).to eq("Forbidden")
        expect(error.status_code).to eq(403)
      end
    end
  end

  describe "#create_coursework" do
    it "creates coursework with correct attributes" do
      coursework = Google::Apis::ClassroomV1::CourseWork.new(id: "cw-1")
      allow(mock_classroom_service).to receive(:create_course_work).and_return(coursework)

      result = service.create_coursework("course-123", {
        title: "Homework 1",
        description: "Do the problems",
        max_points: 100,
        work_type: "ASSIGNMENT"
      })

      expect(result.id).to eq("cw-1")
      expect(mock_classroom_service).to have_received(:create_course_work).with(
        "course-123",
        an_instance_of(Google::Apis::ClassroomV1::CourseWork)
      )
    end
  end

  describe "#list_students" do
    it "handles pagination" do
      student1 = Google::Apis::ClassroomV1::Student.new(user_id: "s1")
      student2 = Google::Apis::ClassroomV1::Student.new(user_id: "s2")
      page1 = Google::Apis::ClassroomV1::ListStudentsResponse.new(students: [ student1 ], next_page_token: "token2")
      page2 = Google::Apis::ClassroomV1::ListStudentsResponse.new(students: [ student2 ], next_page_token: nil)

      allow(mock_classroom_service).to receive(:list_course_students)
        .with("course-123", page_token: nil).and_return(page1)
      allow(mock_classroom_service).to receive(:list_course_students)
        .with("course-123", page_token: "token2").and_return(page2)

      result = service.list_students("course-123")
      expect(result.length).to eq(2)
    end
  end

  describe "#update_student_submission_grade" do
    it "patches assigned and draft grades" do
      submission = Google::Apis::ClassroomV1::StudentSubmission.new
      allow(mock_classroom_service).to receive(:patch_student_submission).and_return(submission)

      service.update_student_submission_grade("c1", "cw1", "sub1", 95.0)

      expect(mock_classroom_service).to have_received(:patch_student_submission).with(
        "c1", "cw1", "sub1",
        an_instance_of(Google::Apis::ClassroomV1::StudentSubmission),
        update_mask: "assignedGrade,draftGrade"
      )
    end
  end
end
