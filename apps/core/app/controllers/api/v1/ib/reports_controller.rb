module Api
  module V1
    module Ib
      class ReportsController < BaseController
        before_action :set_report, only: [ :show, :update ]

        def index
          authorize IbReport
          reports = policy_scope(IbReport).includes(:versions, :deliveries).order(updated_at: :desc)
          reports = reports.where(report_family: params[:report_family]) if params[:report_family].present?
          reports = reports.where(audience: params[:audience]) if params[:audience].present?
          reports = reports.where(student_id: params[:student_id]) if params[:student_id].present?
          render json: reports.map { |report| report_service.serialize(report) }
        end

        def show
          authorize @report
          render json: report_service.serialize(@report)
        end

        def create
          authorize IbReport
          student = User.find_by(id: report_params[:student_id]) if report_params[:student_id].present?
          report = report_service.generate!(
            report_family: report_params.fetch(:report_family),
            student: student,
            audience: report_params[:audience].presence || "internal",
            title: report_params[:title],
            metadata: report_params[:metadata] || {}
          )
          audit_event("ib.report.generated", auditable: report, metadata: { report_family: report.report_family, audience: report.audience })
          render json: report_service.serialize(report), status: :created
        end

        def update
          if %w[mark_read acknowledge].include?(report_params[:action].to_s)
            authorize_read_state!
          else
            authorize @report
          end
          report = report_service.transition!(report: @report, params: report_params)
          audit_event("ib.report.updated", auditable: report, metadata: { action: report_params[:action], status: report.status })
          render json: report_service.serialize(report)
        end

        private

        def set_report
          @report = policy_scope(IbReport).find(params[:id])
        end

        def report_service
          @report_service ||= ::Ib::Reporting::ReportService.new(user: Current.user, school: current_school_scope)
        end

        def report_params
          params.fetch(:ib_report, params).permit(
            :report_family,
            :student_id,
            :audience,
            :title,
            :summary,
            :action,
            :channel,
            :locale,
            :audience_role,
            :delivery_id,
            :recipient_id,
            metadata: {}
          )
        end

        def authorize_read_state!
          receipt = IbDeliveryReceipt.find_by(
            tenant: Current.tenant,
            user: Current.user,
            deliverable_type: "IbReport",
            deliverable_id: @report.id
          )
          if receipt.present?
            skip_authorization
            return
          end

          authorize @report, :show?
        end
      end
    end
  end
end
