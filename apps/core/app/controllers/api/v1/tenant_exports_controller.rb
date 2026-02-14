module Api
  module V1
    class TenantExportsController < ApplicationController
      def export
        authorize :tenant_export, :export?
        TenantDataExportJob.perform_later(Current.tenant.id)
        render json: { message: "Export job enqueued" }, status: :accepted
      end

      def export_status
        authorize :tenant_export, :export_status?
        tenant = Current.tenant

        if tenant.data_export.attached?
          render json: {
            status: "completed",
            download_url: Rails.application.routes.url_helpers.rails_blob_path(tenant.data_export, only_path: true)
          }
        else
          render json: { status: "pending", download_url: nil }
        end
      end

      private

      def skip_authorization?
        false
      end
    end
  end
end
