module Api
  module V1
    class StandardsCoverageController < ApplicationController
      def by_academic_year
        academic_year = AcademicYear.find(params[:academic_year_id] || params[:id])
        authorize :standards_coverage, :index?

        course_ids = policy_scope(Course).where(academic_year_id: academic_year.id).pluck(:id)

        render json: {
          academic_year_id: academic_year.id,
          academic_year: academic_year.name,
          frameworks: build_framework_reports(course_ids, include_source_details: false)
        }
      end

      def by_course
        authorize :standards_coverage, :index?
        course = policy_scope(Course).find(params[:course_id] || params[:id])

        render json: {
          course_id: course.id,
          course_name: course.name,
          frameworks: build_framework_reports([ course.id ], include_source_details: true)
        }
      end

      private

      def build_framework_reports(course_ids, include_source_details:)
        assignment_map = assignment_alignment_map(course_ids)
        unit_map = unit_alignment_map(course_ids)
        covered_standard_ids = (assignment_map.keys + unit_map.keys).uniq

        policy_scope(StandardFramework).includes(:standards).order(:name).map do |framework|
          framework_standards = framework.standards.to_a.sort_by { |standard| standard.code.to_s }
          covered_standards = framework_standards.select { |standard| covered_standard_ids.include?(standard.id) }
          uncovered_standards = framework_standards.reject { |standard| covered_standard_ids.include?(standard.id) }
          total_standards = framework_standards.length

          {
            framework_id: framework.id,
            framework_name: framework.name,
            subject: framework.subject,
            total_standards: total_standards,
            covered_standards: covered_standards.length,
            coverage_percentage: total_standards.positive? ? ((covered_standards.length * 100.0) / total_standards).round(1) : 0.0,
            covered: covered_standards.map { |standard|
              standard_payload(
                standard,
                assignment_map: assignment_map,
                unit_map: unit_map,
                include_source_details: include_source_details
              )
            },
            uncovered: uncovered_standards.map { |standard|
              standard_payload(
                standard,
                assignment_map: assignment_map,
                unit_map: unit_map,
                include_source_details: include_source_details
              )
            }
          }
        end
      end

      def assignment_alignment_map(course_ids)
        return {} if course_ids.empty?

        AssignmentStandard
          .joins(:assignment)
          .where(assignments: { course_id: course_ids })
          .pluck(:standard_id, :assignment_id)
          .each_with_object(Hash.new { |hash, key| hash[key] = [] }) do |(standard_id, assignment_id), map|
            map[standard_id] << assignment_id unless map[standard_id].include?(assignment_id)
          end
      end

      def unit_alignment_map(course_ids)
        return {} if course_ids.empty?

        UnitVersionStandard
          .joins(unit_version: :unit_plan)
          .where(unit_plans: { course_id: course_ids })
          .pluck(:standard_id, "unit_versions.unit_plan_id")
          .each_with_object(Hash.new { |hash, key| hash[key] = [] }) do |(standard_id, unit_plan_id), map|
            map[standard_id] << unit_plan_id unless map[standard_id].include?(unit_plan_id)
          end
      end

      def standard_payload(standard, assignment_map:, unit_map:, include_source_details:)
        assignment_ids = assignment_map[standard.id] || []
        unit_plan_ids = unit_map[standard.id] || []

        payload = {
          id: standard.id,
          code: standard.code,
          description: standard.description.to_s.truncate(100),
          grade_band: standard.grade_band
        }

        return payload unless include_source_details

        payload.merge(
          covered_by_assignment: assignment_ids.any?,
          covered_by_unit_plan: unit_plan_ids.any?,
          assignment_ids: assignment_ids,
          unit_plan_ids: unit_plan_ids
        )
      end
    end
  end
end
