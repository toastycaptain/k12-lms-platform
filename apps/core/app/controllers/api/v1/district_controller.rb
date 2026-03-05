module Api
  module V1
    class DistrictController < ApplicationController
      before_action :require_district_admin!
      before_action :require_district!

      def schools
        authorize :district, :schools?

        payload = district_schools.map do |school|
          resolved = CurriculumProfileResolver.resolve(tenant: school.tenant, school: school)
          {
            id: school.id,
            tenant_id: school.tenant_id,
            school_name: school.name,
            timezone: school.timezone,
            effective_curriculum_profile_key: resolved[:profile_key],
            effective_curriculum_profile_version: resolved[:resolved_profile_version],
            effective_curriculum_source: resolved[:source],
            selected_from: resolved[:selected_from],
            resolution_trace_id: resolved[:resolution_trace_id]
          }
        end

        render json: payload
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

        if params[:operation].to_s == "push_curriculum"
          push_curriculum_distribution
          return
        end

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
        School.unscoped.includes(tenant: :district).where(tenant_id: district_tenants.select(:id)).order(:name)
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

      def push_curriculum_distribution
        profile_key = params[:profile_key].to_s.strip
        profile_version = params[:profile_version].to_s.strip.presence

        if profile_key.blank?
          render json: { error: "profile_key is required" }, status: :unprocessable_content
          return
        end

        unless CurriculumProfileRegistry.exists?(profile_key, profile_version)
          render json: { error: "Invalid profile key/version" }, status: :unprocessable_content
          return
        end

        target_tenants = district_tenants.where(id: Array(params[:target_tenant_ids]).map(&:to_i))
        target_tenants = district_tenants if target_tenants.empty?

        distributed = []
        target_tenants.find_each do |tenant|
          settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
          settings["curriculum_default_profile_key"] = profile_key
          settings["curriculum_default_profile_version"] = profile_version
          settings["curriculum_profile_assignment_enabled"] = true
          tenant.update!(settings: settings)

          assignment = CurriculumProfileAssignment.find_or_initialize_by(
            tenant_id: tenant.id,
            scope_type: "tenant",
            school_id: nil,
            course_id: nil,
            academic_year_id: nil,
            active: true
          )
          assignment.assign_attributes(
            profile_key: profile_key,
            profile_version: profile_version,
            pinned: true,
            is_frozen: false,
            assigned_by: Current.user,
            metadata: assignment.metadata.merge(
              "source" => "district_distribution",
              "district_id" => current_district.id
            )
          )
          assignment.save!

          Array(params[:target_school_ids]).map(&:to_i).uniq.each do |school_id|
            school = School.unscoped.find_by(id: school_id, tenant_id: tenant.id)
            next unless school

            school.update!(
              curriculum_profile_key: profile_key,
              curriculum_profile_version: profile_version
            )

            school_assignment = CurriculumProfileAssignment.find_or_initialize_by(
              tenant_id: tenant.id,
              scope_type: "school",
              school_id: school.id,
              course_id: nil,
              academic_year_id: nil,
              active: true
            )
            school_assignment.assign_attributes(
              profile_key: profile_key,
              profile_version: profile_version,
              pinned: true,
              is_frozen: false,
              assigned_by: Current.user,
              metadata: school_assignment.metadata.merge(
                "source" => "district_distribution",
                "district_id" => current_district.id
              )
            )
            school_assignment.save!
          end

          CurriculumProfileResolver.invalidate_cache!(tenant: tenant)
          distributed << {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            profile_key: profile_key,
            profile_version: profile_version
          }
        end

        audit_event(
          "district.curriculum.distributed",
          auditable: current_district,
          metadata: {
            district_id: current_district.id,
            profile_key: profile_key,
            profile_version: profile_version,
            target_tenant_ids: distributed.map { |row| row[:tenant_id] }
          }
        )

        render json: { distributed: distributed }, status: :created
      end
    end
  end
end
