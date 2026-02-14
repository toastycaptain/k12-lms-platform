class GoogleClassroomService
  attr_reader :user, :service

  def initialize(user)
    @user = user
    @service = Google::Apis::ClassroomV1::ClassroomService.new
    @service.authorization = GoogleTokenService.new(user).google_credentials
  end

  def list_courses
    response = service.list_courses(teacher_id: "me", course_states: [ "ACTIVE" ])
    response.courses || []
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def get_course(course_id)
    service.get_course(course_id)
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def list_students(course_id)
    students = []
    page_token = nil
    loop do
      response = service.list_course_students(course_id, page_token: page_token)
      students.concat(response.students || [])
      page_token = response.next_page_token
      break unless page_token
    end
    students
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def create_coursework(course_id, attrs)
    coursework = Google::Apis::ClassroomV1::CourseWork.new(
      title: attrs[:title],
      description: attrs[:description],
      max_points: attrs[:max_points],
      work_type: attrs[:work_type] || "ASSIGNMENT",
      state: "PUBLISHED"
    )
    if attrs[:due_date].present?
      date = attrs[:due_date].to_date
      coursework.due_date = Google::Apis::ClassroomV1::Date.new(
        year: date.year, month: date.month, day: date.day
      )
    end
    service.create_course_work(course_id, coursework)
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def update_coursework(course_id, coursework_id, attrs)
    coursework = Google::Apis::ClassroomV1::CourseWork.new(
      title: attrs[:title],
      description: attrs[:description],
      max_points: attrs[:max_points]
    )
    update_mask = attrs.keys.map { |k| k.to_s.camelize(:lower) }.join(",")
    service.patch_course_course_work(course_id, coursework_id, coursework, update_mask: update_mask)
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def list_student_submissions(course_id, coursework_id)
    submissions = []
    page_token = nil
    loop do
      response = service.list_student_submissions(course_id, coursework_id, page_token: page_token)
      submissions.concat(response.student_submissions || [])
      page_token = response.next_page_token
      break unless page_token
    end
    submissions
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end

  def update_student_submission_grade(course_id, coursework_id, submission_id, grade)
    submission = Google::Apis::ClassroomV1::StudentSubmission.new(
      assigned_grade: grade,
      draft_grade: grade
    )
    service.patch_student_submission(
      course_id, coursework_id, submission_id, submission,
      update_mask: "assignedGrade,draftGrade"
    )
  rescue Google::Apis::Error => e
    raise GoogleApiError.new(e.message, status_code: e.status_code)
  end
end
