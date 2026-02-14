module Api
  module V1
    class StandardsCoverageController < ApplicationController
      def course_coverage
        course = Course.find(params[:id])
        authorize course, :show?

        framework_id = params[:standard_framework_id]
        return render json: { error: "standard_framework_id is required" }, status: :bad_request unless framework_id

        standards = Standard.where(standard_framework_id: framework_id)
        unit_plans = UnitPlan.where(course: course).where.not(status: "archived")

        coverage = build_coverage(standards, unit_plans)
        render json: coverage
      end

      def academic_year_coverage
        academic_year = AcademicYear.find(params[:id])
        authorize academic_year, :show?

        framework_id = params[:standard_framework_id]
        return render json: { error: "standard_framework_id is required" }, status: :bad_request unless framework_id

        standards = Standard.where(standard_framework_id: framework_id)
        courses = Course.where(academic_year: academic_year)
        unit_plans = UnitPlan.where(course_id: courses.select(:id)).where.not(status: "archived")

        coverage = build_coverage(standards, unit_plans)
        render json: coverage
      end

      private

      def build_coverage(standards, unit_plans)
        current_version_ids = unit_plans.where.not(current_version_id: nil).pluck(:current_version_id)

        covered_map = UnitVersionStandard
          .where(unit_version_id: current_version_ids)
          .where(standard_id: standards.select(:id))
          .includes(:unit_version)
          .each_with_object({}) do |uvs, hash|
            unit_plan_id = uvs.unit_version.unit_plan_id
            hash[uvs.standard_id] ||= []
            hash[uvs.standard_id] << unit_plan_id unless hash[uvs.standard_id].include?(unit_plan_id)
          end

        standards.map do |standard|
          unit_plan_ids = covered_map[standard.id] || []
          {
            standard_id: standard.id,
            code: standard.code,
            description: standard.description,
            grade_band: standard.grade_band,
            covered: unit_plan_ids.any?,
            unit_plan_ids: unit_plan_ids
          }
        end
      end
    end
  end
end
