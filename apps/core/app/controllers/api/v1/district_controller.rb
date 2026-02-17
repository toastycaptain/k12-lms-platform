module Api
  module V1
    class DistrictController < ApplicationController
      before_action :require_district_admin!
      before_action :require_district!

      def schools
        authorize :district, :schools?
        render json: district_schools, each_serializer: SchoolSerializer
      end

      def standards_coverage
        authorize :district, :standards_coverage?

        render json: district_tenants.map { |tenant| coverage_payload_for_tenant(tenant) }
      end

      def user_summary
        authorize :district, :user_summary?

        render json: district_tenants.map { |tenant|
          {
            tenant_id: tenant.id,
            school: tenant.name,
            teachers: role_count_for_tenant(tenant.id, "teacher"),
            students: role_count_for_tenant(tenant.id, "student"),
            admins: role_count_for_tenant(tenant.id, "admin"),
            district_admins: User.unscoped.where(tenant_id: tenant.id, district_admin: true).count
          }
        }
      end

      def push_template
        authorize :district, :push_template?

        source_template = Template.find(params[:template_id])
        target_ids = Array(params[:target_tenant_ids]).map(&:to_i).uniq
        target_tenants = district_tenants.where(id: target_ids)

        if target_tenants.empty?
          render json: { error: "target_tenant_ids must include at least one school in this district" }, status: :unprocessable_content
          return
        end

        pushed = target_tenants.map do |tenant|
          pushed_template = TemplatePushService.new(source_template, tenant, actor: Current.user).call
          {
            tenant_id: tenant.id,
            school: tenant.name,
            template_id: pushed_template.id,
            template_name: pushed_template.name
          }
        end

        render json: { pushed: pushed }, status: :created
      end

      private

      def require_district_admin!
        return if Current.user&.district_admin?

        render json: { error: "Forbidden" }, status: :forbidden
      end

      def require_district!
        return if current_district.present?

        render json: { error: "District not configured for current user" }, status: :unprocessable_content
      end

      def current_district
        @current_district ||= Current.user.tenant&.district
      end

      def district_tenants
        @district_tenants ||= current_district.tenants.order(:id)
      end

      def district_schools
        School.unscoped.where(tenant_id: district_tenants.select(:id)).order(:name)
      end

      def role_count_for_tenant(tenant_id, role_name)
        UserRole.unscoped
                .joins("INNER JOIN users ON users.id = user_roles.user_id")
                .joins("INNER JOIN roles ON roles.id = user_roles.role_id")
                .where(users: { tenant_id: tenant_id }, roles: { tenant_id: tenant_id, name: role_name })
                .distinct
                .count(:user_id)
      end

      def coverage_payload_for_tenant(tenant)
        framework_rows = framework_coverages_for_tenant(tenant.id)
        total_standards = framework_rows.sum { |row| row[:total_standards] }
        covered_standards = framework_rows.sum { |row| row[:covered_standards] }
        coverage_pct = total_standards.zero? ? 0.0 : ((covered_standards * 100.0) / total_standards).round(1)

        {
          tenant_id: tenant.id,
          school: tenant.name,
          frameworks_count: framework_rows.length,
          standards_count: total_standards,
          covered_standards: covered_standards,
          coverage_pct: coverage_pct,
          frameworks: framework_rows
        }
      end

      def framework_coverages_for_tenant(tenant_id)
        covered_ids = covered_standard_ids_for_tenant(tenant_id)

        StandardFramework.unscoped.where(tenant_id: tenant_id).order(:name).map do |framework|
          standard_ids = Standard.unscoped.where(tenant_id: tenant_id, standard_framework_id: framework.id).pluck(:id)
          covered_count = standard_ids.intersection(covered_ids).count
          total_count = standard_ids.count

          {
            framework_id: framework.id,
            framework_name: framework.name,
            subject: framework.subject,
            total_standards: total_count,
            covered_standards: covered_count,
            coverage_pct: total_count.zero? ? 0.0 : ((covered_count * 100.0) / total_count).round(1)
          }
        end
      end

      def covered_standard_ids_for_tenant(tenant_id)
        assignment_ids = AssignmentStandard.unscoped
                                         .joins("INNER JOIN assignments ON assignments.id = assignment_standards.assignment_id")
                                         .where(assignments: { tenant_id: tenant_id })
                                         .distinct
                                         .pluck(:standard_id)
        unit_ids = UnitVersionStandard.unscoped
                                      .joins("INNER JOIN unit_versions ON unit_versions.id = unit_version_standards.unit_version_id")
                                      .joins("INNER JOIN unit_plans ON unit_plans.id = unit_versions.unit_plan_id")
                                      .where(unit_plans: { tenant_id: tenant_id })
                                      .distinct
                                      .pluck(:standard_id)

        (assignment_ids + unit_ids).uniq
      end
    end
  end
end
