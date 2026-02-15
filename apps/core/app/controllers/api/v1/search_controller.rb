module Api
  module V1
    class SearchController < ApplicationController
      def index
        authorize :search, :index?
        unit_plan_scope = policy_scope(UnitPlan)
        lesson_plan_scope = policy_scope(LessonPlan)
        course_scope = policy_scope(Course)
        standard_scope = policy_scope(Standard)
        assignment_scope = policy_scope(Assignment)

        query = params[:q].to_s.strip
        return render json: { results: [] } if query.length < 2

        pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"
        results = []
        student_only = Current.user.has_role?(:student) &&
          !Current.user.has_role?(:teacher) &&
          !Current.user.has_role?(:admin) &&
          !Current.user.has_role?(:curriculum_lead)

        unless student_only
          unit_plans = unit_plan_scope.where("unit_plans.title ILIKE ?", pattern).limit(5)
          results.concat(unit_plans.map { |unit_plan|
            {
              type: "unit_plan",
              id: unit_plan.id,
              title: unit_plan.title,
              url: "/plan/units/#{unit_plan.id}"
            }
          })

          lesson_plans = lesson_plan_scope.where("lesson_plans.title ILIKE ?", pattern).limit(5)
          results.concat(lesson_plans.map { |lesson_plan|
            {
              type: "lesson_plan",
              id: lesson_plan.id,
              title: lesson_plan.title,
              url: "/plan/units/#{lesson_plan.unit_plan_id}/lessons/#{lesson_plan.id}"
            }
          })
        end

        courses = course_scope.where("courses.name ILIKE ?", pattern).limit(5)
        results.concat(courses.map { |course|
          {
            type: "course",
            id: course.id,
            title: course.name,
            url: student_only ? "/learn/courses/#{course.id}" : "/teach/courses/#{course.id}"
          }
        })

        unless student_only
          standards = standard_scope.where("standards.code ILIKE :q OR standards.description ILIKE :q", q: pattern).limit(5)
          results.concat(standards.map { |standard|
            {
              type: "standard",
              id: standard.id,
              title: "#{standard.code}: #{standard.description.to_s.truncate(60)}",
              url: "/plan/standards"
            }
          })
        end

        assignments = assignment_scope.where("assignments.title ILIKE ?", pattern).limit(5)
        results.concat(assignments.map { |assignment|
          {
            type: "assignment",
            id: assignment.id,
            title: assignment.title,
            url: student_only ? "/learn/courses/#{assignment.course_id}/assignments/#{assignment.id}" : "/teach/courses/#{assignment.course_id}/assignments/#{assignment.id}"
          }
        })

        render json: { results: results }
      end
    end
  end
end
