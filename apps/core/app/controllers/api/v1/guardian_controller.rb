module Api
  module V1
    class GuardianController < ApplicationController
      before_action :set_student, only: [ :grades, :assignments, :announcements, :attendance, :classes_today, :calendar ]

      # GET /api/v1/guardian/students
      def students
        authorize :guardian, :index?, policy_class: GuardianPolicy

        linked_student_ids = GuardianLink.active.where(guardian_id: Current.user.id).pluck(:student_id)
        students = User.where(id: linked_student_ids)
                       .includes(enrollments: { section: :course })
                       .order(:last_name, :first_name)

        render json: students, each_serializer: StudentSummarySerializer
      end

      # GET /api/v1/guardian/students/:id/grades
      def grades
        submissions = Submission.where(user_id: @student.id, assignment_id: assignment_scope.select(:id))
                                .includes(assignment: :course)
                                .order(graded_at: :desc)

        render json: submissions, each_serializer: GuardianGradeSerializer
      end

      # GET /api/v1/guardian/students/:id/assignments
      def assignments
        assignments = assignment_scope
                        .where("due_at >= ?", 30.days.ago)
                        .includes(:course)
                        .order(due_at: :asc)

        submissions_by_assignment = Submission.where(
          user_id: @student.id,
          assignment_id: assignments.select(:id)
        ).index_by(&:assignment_id)

        render json: assignments,
          each_serializer: GuardianAssignmentSerializer,
          submissions_by_assignment: submissions_by_assignment
      end

      # GET /api/v1/guardian/students/:id/announcements
      def announcements
        announcements = Announcement.where(course_id: course_ids)
                                    .published
                                    .order(created_at: :desc)
                                    .limit(20)

        render json: announcements
      end

      # GET /api/v1/guardian/students/:id/attendance
      def attendance
        attendances = Attendance
          .includes(section: :course)
          .includes(:recorded_by)
          .where(student_id: @student.id, occurred_on: attendance_start_date..attendance_end_date)
          .recent_first

        render json: {
          summary: attendance_summary(attendances),
          records: attendances.map { |row| serialize_attendance(row) }
        }
      end

      # GET /api/v1/guardian/students/:id/classes_today
      def classes_today
        zone = ActiveSupport::TimeZone[tenant_timezone] || ActiveSupport::TimeZone["UTC"]
        local_today = Time.current.in_time_zone(zone).to_date
        weekday = local_today.wday
        section_ids = enrolled_section_ids

        meetings = SectionMeeting
          .includes(section: :course)
          .where(section_id: section_ids, weekday: weekday)
          .order(:start_time)

        teachers_by_section = teachers_by_section_id(section_ids)

        render json: meetings.map { |meeting| serialize_meeting(meeting, local_today, zone, teachers_by_section) }
      end

      # GET /api/v1/guardian/students/:id/calendar
      def calendar
        events = (unit_plan_events + assignment_events + quiz_events).sort_by do |event|
          event_sort_key(event)
        end

        render json: { events: events }
      end

      private

      def set_student
        @student = User.find(params[:id])
        authorize @student, :show?, policy_class: GuardianPolicy
      end

      def assignment_scope
        Assignment.where(course_id: course_ids, status: "published")
      end

      def course_ids
        @course_ids ||= Enrollment.joins(:section)
                                  .where(user_id: @student.id, role: "student")
                                  .distinct
                                  .pluck("sections.course_id")
      end

      def enrolled_section_ids
        @enrolled_section_ids ||= Enrollment.where(user_id: @student.id, role: "student").pluck(:section_id)
      end

      def attendance_start_date
        parse_date(params[:start_date]) || 30.days.ago.to_date
      end

      def attendance_end_date
        parse_date(params[:end_date]) || Date.current
      end

      def attendance_summary(attendances)
        counts = attendances.unscope(:order).group(:status).count
        {
          total: attendances.count,
          present: counts.fetch("present", 0),
          absent: counts.fetch("absent", 0),
          tardy: counts.fetch("tardy", 0),
          excused: counts.fetch("excused", 0)
        }
      end

      def serialize_attendance(attendance)
        section = attendance.section
        course = section&.course
        recorded_by = attendance.recorded_by

        {
          id: attendance.id,
          student_id: @student.id,
          student_name: student_name,
          section_id: section&.id,
          section_name: section&.name,
          course_id: course&.id,
          course_name: course&.name,
          occurred_on: attendance.occurred_on,
          status: attendance.status,
          notes: attendance.notes,
          recorded_by: recorded_by ? { id: recorded_by.id, name: [ recorded_by.first_name, recorded_by.last_name ].compact.join(" ").strip } : nil
        }
      end

      def serialize_meeting(meeting, local_today, zone, teachers_by_section)
        day_start = zone.local(local_today.year, local_today.month, local_today.day)
        start_at = day_start + meeting.start_time.seconds_since_midnight.seconds
        end_at = day_start + meeting.end_time.seconds_since_midnight.seconds

        {
          student_id: @student.id,
          student_name: student_name,
          section_id: meeting.section_id,
          section_name: meeting.section.name,
          course_id: meeting.section.course_id,
          course_name: meeting.section.course.name,
          weekday: meeting.weekday,
          start_at: start_at.iso8601,
          end_at: end_at.iso8601,
          location: meeting.location,
          teachers: teachers_by_section.fetch(meeting.section_id, [])
        }
      end

      def teachers_by_section_id(section_ids)
        rows = Enrollment
          .joins(:user)
          .where(section_id: section_ids, role: "teacher")
          .select("enrollments.section_id AS section_id", "users.id AS user_id", "users.first_name", "users.last_name")

        rows.group_by(&:section_id).transform_values do |teacher_rows|
          teacher_rows.map do |row|
            {
              id: row.user_id,
              name: [ row.first_name, row.last_name ].compact.join(" ").strip
            }
          end
        end
      end

      def unit_plan_events
        start_sql = "COALESCE(unit_plans.start_date, unit_plans.created_at::date)"
        end_sql = "COALESCE(unit_plans.end_date, unit_plans.start_date, unit_plans.created_at::date)"

        UnitPlan
          .where(course_id: course_ids, status: "published")
          .where("#{start_sql} <= ? AND #{end_sql} >= ?", calendar_end_date, calendar_start_date)
          .select(:id, :title, :start_date, :end_date, :created_at, :course_id, :status)
          .map do |unit_plan|
            start_date = unit_plan.start_date || unit_plan.created_at.to_date
            end_date = unit_plan.end_date || start_date

            {
              type: "unit_plan",
              id: unit_plan.id,
              title: unit_plan.title,
              start_date: start_date,
              end_date: end_date,
              course_id: unit_plan.course_id,
              status: unit_plan.status
            }
          end
      end

      def assignment_events
        Assignment
          .where(course_id: course_ids, status: "published")
          .where(due_at: calendar_start_time..calendar_end_time)
          .pluck(:id, :title, :due_at, :course_id, :status)
          .map do |id, title, due_at, course_id, status|
            {
              type: "assignment",
              id: id,
              title: title,
              due_date: due_at,
              course_id: course_id,
              status: status
            }
          end
      end

      def quiz_events
        Quiz
          .where(course_id: course_ids, status: "published")
          .where(due_at: calendar_start_time..calendar_end_time)
          .pluck(:id, :title, :due_at, :course_id, :status)
          .map do |id, title, due_at, course_id, status|
            {
              type: "quiz",
              id: id,
              title: title,
              due_date: due_at,
              course_id: course_id,
              status: status
            }
          end
      end

      def calendar_start_date
        @calendar_start_date ||= parse_date(params[:start_date]) || Date.current.beginning_of_month
      end

      def calendar_end_date
        @calendar_end_date ||= parse_date(params[:end_date]) || (calendar_start_date + 2.months)
      end

      def calendar_start_time
        calendar_start_date.beginning_of_day
      end

      def calendar_end_time
        calendar_end_date.end_of_day
      end

      def event_sort_key(event)
        value = event[:start_date] || event[:due_date]
        return Time.zone.at(0) if value.blank?
        return value.to_time if value.respond_to?(:to_time)

        Time.zone.parse(value.to_s) || Time.zone.at(0)
      rescue ArgumentError
        Time.zone.at(0)
      end

      def parse_date(value)
        return nil if value.blank?

        Date.iso8601(value.to_s)
      rescue ArgumentError
        nil
      end

      def student_name
        [ @student.first_name, @student.last_name ].compact.join(" ").strip
      end

      def tenant_timezone
        Current.tenant&.settings&.dig("timezone") ||
          School.where(tenant_id: Current.tenant&.id).order(:id).pick(:timezone) ||
          "UTC"
      end
    end
  end
end
