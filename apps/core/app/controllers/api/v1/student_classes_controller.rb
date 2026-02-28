module Api
  module V1
    class StudentClassesController < ApplicationController
      before_action :set_student
      before_action :authorize_student_data

      def index
        policy_scope(User, policy_scope_class: StudentProgressPolicy::Scope)
        zone = ActiveSupport::TimeZone[tenant_timezone] || ActiveSupport::TimeZone["UTC"]
        local_today = Time.current.in_time_zone(zone).to_date
        weekday = local_today.wday

        meetings = SectionMeeting
          .includes(section: :course)
          .where(section_id: enrolled_section_ids, weekday: weekday)
          .order(:start_time)

        render json: meetings.map { |meeting| serialize_meeting(meeting, local_today, zone) }
      end

      private

      def set_student
        @student = User.find(params[:student_id])
      end

      def authorize_student_data
        authorize @student, :show?, policy_class: StudentProgressPolicy
      end

      def enrolled_section_ids
        @enrolled_section_ids ||= Enrollment.where(user_id: @student.id, role: "student").pluck(:section_id)
      end

      def teachers_by_section_id
        @teachers_by_section_id ||= begin
          rows = Enrollment
            .joins(:user)
            .where(section_id: enrolled_section_ids, role: "teacher")
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
      end

      def serialize_meeting(meeting, local_today, zone)
        day_start = zone.local(local_today.year, local_today.month, local_today.day)
        start_at = day_start + meeting.start_time.seconds_since_midnight.seconds
        end_at = day_start + meeting.end_time.seconds_since_midnight.seconds

        {
          section_id: meeting.section_id,
          section_name: meeting.section.name,
          course_id: meeting.section.course_id,
          course_name: meeting.section.course.name,
          weekday: meeting.weekday,
          start_at: start_at.iso8601,
          end_at: end_at.iso8601,
          location: meeting.location,
          teachers: teachers_by_section_id.fetch(meeting.section_id, [])
        }
      end

      def tenant_timezone
        Current.tenant&.settings&.dig("timezone") ||
          School.where(tenant_id: Current.tenant&.id).order(:id).pick(:timezone) ||
          "UTC"
      end
    end
  end
end
