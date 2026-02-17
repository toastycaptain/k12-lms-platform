module Api
  module V1
    class CalendarController < ApplicationController
      # GET /api/v1/calendar?start_date=2026-02-01&end_date=2026-03-01&course_id=optional
      def index
        authorize :calendar, :index?

        render json: { events: calendar_events }
      end

      # GET /api/v1/calendar.ics
      def ical
        authorize :calendar, :index?

        send_data(
          generate_ical(calendar_events),
          filename: "calendar.ics",
          type: "text/calendar"
        )
      end

      private

      def calendar_events
        (unit_plan_events + assignment_events + quiz_events).sort_by { |event|
          event_sort_key(event)
        }
      end

      def event_sort_key(event)
        value = event[:start_date] || event[:due_date]
        return Time.zone.at(0) if value.blank?
        return value.to_time if value.respond_to?(:to_time)

        Time.zone.parse(value.to_s) || Time.zone.at(0)
      rescue ArgumentError
        Time.zone.at(0)
      end

      def range_start_date
        @range_start_date ||= parse_date(params[:start_date]) || Date.current.beginning_of_month
      end

      def range_end_date
        @range_end_date ||= parse_date(params[:end_date]) || (range_start_date + 2.months)
      end

      def range_start_time
        range_start_date.beginning_of_day
      end

      def range_end_time
        range_end_date.end_of_day
      end

      def parse_date(value)
        return nil if value.blank?

        Date.iso8601(value.to_s)
      rescue ArgumentError
        nil
      end

      def course_scope
        @course_scope ||= begin
          scope = policy_scope(Course)
          scope = scope.where(id: params[:course_id]) if params[:course_id].present?
          scope
        end
      end

      def course_id_scope
        course_scope.select(:id)
      end

      def unit_plan_scope
        scope = UnitPlan.where(course_id: course_id_scope)

        if include_owned_unit_plans?
          scope = scope.or(UnitPlan.where(created_by_id: Current.user.id))
        end

        scope
      end

      def include_owned_unit_plans?
        params[:course_id].blank? &&
          Current.user.has_role?(:teacher) &&
          !Current.user.has_role?(:admin) &&
          !Current.user.has_role?(:curriculum_lead)
      end

      def unit_plan_events
        start_sql = "COALESCE(unit_plans.start_date, unit_plans.created_at::date)"
        end_sql = "COALESCE(unit_plans.end_date, unit_plans.start_date, unit_plans.created_at::date)"

        unit_plan_scope
          .where("#{start_sql} <= ? AND #{end_sql} >= ?", range_end_date, range_start_date)
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
        policy_scope(Assignment)
          .where(course_id: course_id_scope)
          .where(due_at: range_start_time..range_end_time)
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
        policy_scope(Quiz)
          .where(course_id: course_id_scope)
          .where(due_at: range_start_time..range_end_time)
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

      def generate_ical(events)
        lines = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//K12 LMS//Planning Calendar//EN",
          "CALSCALE:GREGORIAN",
          "METHOD:PUBLISH"
        ]

        events.each do |event|
          lines.concat(ical_event_lines(event))
        end

        lines << "END:VCALENDAR"
        "#{lines.join("\r\n")}\r\n"
      end

      def ical_event_lines(event)
        uid = "#{event[:type]}-#{event[:id]}-#{Current.tenant.id}@k12-lms"
        now_stamp = Time.current.utc.strftime("%Y%m%dT%H%M%SZ")
        summary = escape_ical_text(event[:title])

        lines = [
          "BEGIN:VEVENT",
          "UID:#{uid}",
          "DTSTAMP:#{now_stamp}",
          "SUMMARY:#{summary}"
        ]

        if event[:type] == "unit_plan"
          start_date = (event[:start_date] || Date.current).to_date
          end_date = (event[:end_date] || start_date).to_date + 1.day
          lines << "DTSTART;VALUE=DATE:#{start_date.strftime('%Y%m%d')}"
          lines << "DTEND;VALUE=DATE:#{end_date.strftime('%Y%m%d')}"
        else
          due_at = event[:due_date]
          if due_at.present?
            due_stamp = due_at.to_time.utc.strftime("%Y%m%dT%H%M%SZ")
            lines << "DTSTART:#{due_stamp}"
            lines << "DUE:#{due_stamp}"
          end
        end

        lines << "END:VEVENT"
        lines
      end

      def escape_ical_text(value)
        value.to_s
             .gsub("\\", "\\\\")
             .gsub("\n", "\\n")
             .gsub(",", "\\,")
             .gsub(";", "\\;")
      end
    end
  end
end
