module Api
  module V1
    module Admin
      class ProvisioningController < ApplicationController
        def create_school
          authorize :provisioning, :manage?
          result = TenantProvisioningService.new(provisioning_params_for(school_params.to_h)).call
          audit_event(
            "provisioning.school_created",
            auditable: result[:tenant],
            metadata: {
              tenant_id: result[:tenant].id,
              school_id: result[:school].id,
              delegated_district_admin: delegated_district_admin?
            }
          )

          render json: {
            tenant_id: result[:tenant].id,
            tenant_slug: result[:tenant].slug,
            school_id: result[:school].id,
            admin_id: result[:admin].id,
            admin_email: result[:admin].email,
            setup_token: result[:setup_token]
          }, status: :created
        rescue TenantProvisioningService::ProvisioningError => e
          render json: { error: e.message }, status: :unprocessable_content
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.record.errors.full_messages.join(", ") }, status: :unprocessable_content
        end

        def bulk_create
          authorize :provisioning, :manage?

          schools = Array(params[:schools])
          results = schools.map do |school_attrs|
            begin
              result = TenantProvisioningService.new(
                provisioning_params_for(permitted_school_hash(school_attrs))
              ).call
              {
                status: "created",
                tenant_id: result[:tenant].id,
                tenant_slug: result[:tenant].slug
              }
            rescue StandardError => e
              {
                status: "failed",
                subdomain: school_attrs[:subdomain] || school_attrs["subdomain"],
                error: e.message
              }
            end
          end

          audit_event(
            "provisioning.bulk_create.completed",
            metadata: {
              attempted: schools.length,
              created: results.count { |row| row[:status] == "created" },
              failed: results.count { |row| row[:status] == "failed" },
              delegated_district_admin: delegated_district_admin?
            }
          )

          render json: { results: results }, status: :ok
        end

        def checklist
          authorize :provisioning, :manage?
          tenant = accessible_tenants_scope.find(params[:tenant_id])
          render json: OnboardingChecklistService.new(tenant).call
        end

        def tenants
          authorize :provisioning, :manage?

          render json: accessible_tenants_scope.map { |tenant|
            checklist = OnboardingChecklistService.new(tenant).call
            {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              completion_percentage: checklist[:completion_percentage],
              created_at: tenant.created_at
            }
          }
        end

        def import
          authorize :provisioning, :manage?
          tenant = accessible_tenants_scope.find(params[:tenant_id])

          result = DataImportService.new(
            tenant,
            import_type: params[:import_type],
            csv_content: params[:csv_content].to_s,
            imported_by: Current.user
          ).call

          audit_event(
            "provisioning.import.completed",
            auditable: tenant,
            metadata: {
              tenant_id: tenant.id,
              import_type: params[:import_type],
              created: result[:created],
              updated: result[:updated],
              skipped: result[:skipped],
              error_count: Array(result[:errors]).size
            }
          )

          render json: result
        rescue DataImportService::ImportError => e
          render json: { error: e.message }, status: :unprocessable_content
        end

        private

        def school_params
          params.require(:school).permit(
            :school_name,
            :subdomain,
            :admin_email,
            :admin_first_name,
            :admin_last_name,
            :timezone,
            :logo_url,
            :primary_color,
            :academic_year_start_month,
            :safety_level,
            :ai_enabled,
            :google_enabled,
            :curriculum_default_profile_key,
            :district_id
          )
        end

        def permitted_school_hash(raw_attrs)
          ActionController::Parameters
            .new(raw_attrs)
            .permit(
              :school_name,
              :subdomain,
              :admin_email,
              :admin_first_name,
              :admin_last_name,
              :timezone,
              :logo_url,
              :primary_color,
              :academic_year_start_month,
              :safety_level,
              :ai_enabled,
              :google_enabled,
              :curriculum_default_profile_key,
              :district_id
            )
            .to_h
        end

        def provisioning_params_for(attrs)
          payload = attrs.symbolize_keys

          if delegated_district_admin?
            payload[:district_id] = delegated_district_id
          end

          payload
        end

        def accessible_tenants_scope
          scope = Tenant.unscoped.order(:name)

          return scope if Current.user&.has_role?(:admin)

          if delegated_district_admin?
            return Tenant.unscoped.none if delegated_district_id.blank?

            return scope.where(district_id: delegated_district_id)
          end

          Tenant.unscoped.none
        end

        def delegated_district_admin?
          Current.user&.district_admin? && !Current.user&.has_role?(:admin)
        end

        def delegated_district_id
          Current.user&.tenant&.district_id
        end
      end
    end
  end
end
