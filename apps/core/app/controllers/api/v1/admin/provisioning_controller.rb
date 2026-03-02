module Api
  module V1
    module Admin
      class ProvisioningController < ApplicationController
        def create_school
          authorize :provisioning, :manage?
          result = TenantProvisioningService.new(school_params).call

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
              result = TenantProvisioningService.new(school_attrs).call
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

          render json: { results: results }, status: :ok
        end

        def checklist
          authorize :provisioning, :manage?
          tenant = Tenant.unscoped.find(params[:tenant_id])
          render json: OnboardingChecklistService.new(tenant).call
        end

        def tenants
          authorize :provisioning, :manage?

          render json: Tenant.unscoped.order(:name).map { |tenant|
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
          tenant = Tenant.unscoped.find(params[:tenant_id])

          result = DataImportService.new(
            tenant,
            import_type: params[:import_type],
            csv_content: params[:csv_content].to_s,
            imported_by: Current.user
          ).call

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
            :curriculum_default_profile_key
          )
        end
      end
    end
  end
end
