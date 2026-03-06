module Api
  module V1
    module Ib
      class OperationalRecordsController < BaseController
        before_action :set_record, only: [ :show, :update ]

        def index
          authorize IbOperationalRecord
          records = policy_scope(IbOperationalRecord).includes(:checkpoints, :curriculum_document, :student, :owner, :advisor).order(updated_at: :desc)
          records = records.where(programme: programmes_filter) if programmes_filter.any?
          records = records.where(record_family: record_families_filter) if record_families_filter.any?
          records = records.where(status: params[:status]) if params[:status].present?
          records = records.where(risk_level: params[:risk_level]) if params[:risk_level].present?
          records = records.where(subtype: params[:subtype]) if params[:subtype].present?
          records = records.where(planning_context_id: params[:planning_context_id]) if params[:planning_context_id].present?
          records = records.where(curriculum_document_id: params[:curriculum_document_id]) if params[:curriculum_document_id].present?
          records = records.where(student_id: params[:student_id]) if params[:student_id].present?
          records = records.where(owner_id: params[:owner_id]) if params[:owner_id].present?
          records = records.where(advisor_id: params[:advisor_id]) if params[:advisor_id].present?
          records = records.where("due_on >= ?", params[:due_after]) if params[:due_after].present?
          records = records.where("due_on <= ?", params[:due_before]) if params[:due_before].present?
          if params[:q].present?
            term = "%#{params[:q].to_s.strip}%"
            records = records.where(
              "title ILIKE :term OR summary ILIKE :term OR next_action ILIKE :term",
              term: term
            )
          end
          render json: records
        end

        def show
          authorize @record
          render json: @record
        end

        def create
          authorize IbOperationalRecord
          record = IbOperationalRecord.create!(record_params.merge(
            tenant: Current.tenant,
            school_id: current_school_scope&.id || record_params.fetch(:school_id)
          ))
          sync_checkpoints!(record)
          render json: record, status: :created
        end

        def update
          authorize @record
          @record.update!(record_params)
          sync_checkpoints!(@record)
          render json: @record
        end

        private

        def set_record
          @record = policy_scope(IbOperationalRecord).includes(:checkpoints, :curriculum_document, :student, :owner, :advisor).find(params[:id])
        end

        def record_params
          params.require(:ib_operational_record).permit(
            :school_id, :planning_context_id, :curriculum_document_id, :student_id, :owner_id, :advisor_id,
            :programme, :record_family, :subtype, :status, :priority, :risk_level, :due_on, :title,
            :summary, :next_action, :route_hint, metadata: {}
          )
        end

        def sync_checkpoints!(record)
          return unless params[:ib_operational_record][:checkpoints].is_a?(Array)

          record.checkpoints.destroy_all
          params[:ib_operational_record][:checkpoints].each_with_index do |checkpoint, index|
            record.checkpoints.create!(
              tenant: Current.tenant,
              reviewer_id: checkpoint[:reviewer_id],
              position: index,
              status: checkpoint[:status] || "pending",
              due_on: checkpoint[:due_on],
              completed_at: checkpoint[:completed_at],
              title: checkpoint[:title],
              summary: checkpoint[:summary],
              metadata: checkpoint[:metadata] || {}
            )
          end
        end

        def record_families_filter
          Array(params[:record_family]).flat_map { |value| value.to_s.split(",") }.map(&:strip).reject(&:blank?)
        end

        def programmes_filter
          Array(params[:programme]).flat_map { |value| value.to_s.split(",") }.map(&:strip).reject(&:blank?)
        end
      end
    end
  end
end
