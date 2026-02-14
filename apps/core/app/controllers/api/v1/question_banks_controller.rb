module Api
  module V1
    class QuestionBanksController < ApplicationController
      before_action :set_question_bank, only: [ :show, :update, :destroy, :archive, :export_qti, :export_qti_status, :import_qti ]

      def index
        banks = policy_scope(QuestionBank)
        banks = banks.where(subject: params[:subject]) if params[:subject].present?
        banks = banks.where(grade_level: params[:grade_level]) if params[:grade_level].present?
        render json: banks
      end

      def show
        authorize @question_bank
        render json: @question_bank
      end

      def create
        @question_bank = QuestionBank.new(question_bank_params)
        @question_bank.tenant = Current.tenant
        @question_bank.created_by = Current.user
        authorize @question_bank
        if @question_bank.save
          render json: @question_bank, status: :created
        else
          render json: { errors: @question_bank.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @question_bank
        if @question_bank.update(question_bank_params)
          render json: @question_bank
        else
          render json: { errors: @question_bank.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @question_bank
        @question_bank.destroy!
        head :no_content
      end

      def archive
        authorize @question_bank
        @question_bank.archive!
        render json: @question_bank
      rescue ActiveRecord::RecordInvalid
        render json: { errors: [ "Cannot archive a #{@question_bank.status} question bank" ] }, status: :unprocessable_content
      end

      def export_qti
        authorize @question_bank, :update?
        QtiExportJob.perform_later(@question_bank.id)
        render json: { status: "queued" }, status: :accepted
      end

      def export_qti_status
        authorize @question_bank, :update?
        if @question_bank.qti_export.attached?
          render json: {
            status: "completed",
            download_url: rails_blob_url(@question_bank.qti_export, disposition: "attachment")
          }
        else
          render json: { status: "processing" }
        end
      end

      def import_qti
        authorize @question_bank, :update?
        unless params[:file].present?
          render json: { errors: ["File is required"] }, status: :unprocessable_entity
          return
        end
        blob = ActiveStorage::Blob.create_and_upload!(
          io: params[:file],
          filename: params[:file].original_filename,
          content_type: "application/xml"
        )
        QtiImportJob.perform_later(@question_bank.id, blob.id, Current.user.id)
        render json: { status: "queued" }, status: :accepted
      end

      private

      def set_question_bank
        @question_bank = QuestionBank.find(params[:id])
      end

      def question_bank_params
        params.permit(:title, :description, :subject, :grade_level)
      end
    end
  end
end
