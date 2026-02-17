module Api
  module V1
    class UnitPlansController < ApplicationController
      before_action :set_unit_plan, only: [ :show, :update, :destroy, :create_version, :versions, :publish, :archive,
                                          :export_pdf, :export_pdf_status, :submit_for_approval ]

      def index
        @unit_plans = policy_scope(UnitPlan).includes(:unit_versions, current_version: :standards)
        @unit_plans = @unit_plans.where(course_id: params[:course_id]) if params[:course_id]
        @unit_plans = paginate(@unit_plans)
        render json: @unit_plans
      end

      def show
        render json: @unit_plan
      end

      def create
        @unit_plan = UnitPlan.new(unit_plan_params)
        @unit_plan.created_by = Current.user
        authorize @unit_plan

        if @unit_plan.save
          @unit_plan.create_version!(title: @unit_plan.title)
          render json: @unit_plan, status: :created
        else
          render json: { errors: @unit_plan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @unit_plan.update(unit_plan_params.except(:course_id))
          render json: @unit_plan
        else
          render json: { errors: @unit_plan.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        @unit_plan.destroy!
        head :no_content
      end

      def create_version
        authorize @unit_plan

        version = @unit_plan.create_version!(version_params)
        render json: version, status: :created
      end

      def versions
        authorize @unit_plan, :show?
        render json: @unit_plan.unit_versions.includes(:standards).order(version_number: :desc)
      end

      def publish
        authorize @unit_plan
        if approval_required? && @unit_plan.status == "draft"
          return render json: { errors: [ "Approval is required. Use submit_for_approval instead." ] },
                        status: :unprocessable_content
        end
        @unit_plan.publish!
        render json: @unit_plan
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot publish: unit must be in draft status with a current version" ] },
               status: :unprocessable_content
      end

      def submit_for_approval
        authorize @unit_plan
        unless approval_required?
          return render json: { errors: [ "Approval is not required for this tenant" ] },
                        status: :unprocessable_content
        end
        @unit_plan.submit_for_approval!(user: Current.user)
        notify_approvers_for_approval_request!(@unit_plan)
        render json: @unit_plan
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot submit: unit must be in draft status with a current version" ] },
               status: :unprocessable_content
      end

      def archive
        authorize @unit_plan
        @unit_plan.archive!
        render json: @unit_plan
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot archive: unit must be in published status" ] },
               status: :unprocessable_content
      end

      def export_pdf
        authorize @unit_plan, :show?
        job = PdfExportJob.perform_later(@unit_plan.id)
        render json: { job_id: job.provider_job_id, status: "queued" }, status: :accepted
      end

      def export_pdf_status
        authorize @unit_plan, :show?
        if @unit_plan.exported_pdf.attached?
          render json: {
            status: "completed",
            download_url: rails_blob_url(@unit_plan.exported_pdf, disposition: "attachment")
          }
        else
          render json: { status: "processing" }
        end
      end

      private

      def set_unit_plan
        @unit_plan = UnitPlan.includes(:unit_versions, current_version: :standards).find(params[:id])
        authorize @unit_plan unless %w[create_version versions publish archive export_pdf export_pdf_status submit_for_approval].include?(action_name)
      end

      def unit_plan_params
        params.require(:unit_plan).permit(:course_id, :title, :status, :start_date, :end_date)
      end

      def version_params
        params.require(:version).permit(:title, :description, essential_questions: [], enduring_understandings: [])
      end

      def approval_required?
        Current.tenant&.settings&.dig("approval_required") == true
      end

      def notify_approvers_for_approval_request!(unit_plan)
        approver_ids = User.joins(:roles).where(roles: { name: %w[admin curriculum_lead] }).distinct.pluck(:id)
        User.where(id: approver_ids).find_each do |approver|
          next if approver.id == Current.user.id

          NotificationService.notify(
            user: approver,
            event_type: "approval_requested",
            title: "Approval requested: #{unit_plan.title}",
            message: "#{Current.user.first_name} #{Current.user.last_name} submitted a unit for review.",
            url: "/plan/approvals",
            actor: Current.user,
            notifiable: unit_plan,
            metadata: {
              title: unit_plan.title,
              unit_plan_id: unit_plan.id
            }
          )
        end
      end
    end
  end
end
