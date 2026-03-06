module Api
  module V1
    module Ib
      module Pyp
        class ProgrammeOfInquiriesController < BaseController
          before_action :set_programme_of_inquiry, only: [ :show, :update ]

          def index
            authorize PypProgrammeOfInquiry
            render json: policy_scope(PypProgrammeOfInquiry).includes(:entries).order(updated_at: :desc)
          end

          def show
            authorize @programme_of_inquiry
            render json: @programme_of_inquiry
          end

          def create
            authorize PypProgrammeOfInquiry
            poi = PypProgrammeOfInquiry.create!(programme_of_inquiry_params.merge(
              tenant: Current.tenant,
              school_id: current_school_scope&.id || programme_of_inquiry_params.fetch(:school_id)
            ))
            sync_entries!(poi)
            render json: poi, status: :created
          end

          def update
            authorize @programme_of_inquiry
            @programme_of_inquiry.update!(programme_of_inquiry_params)
            sync_entries!(@programme_of_inquiry)
            render json: @programme_of_inquiry
          end

          private

          def set_programme_of_inquiry
            @programme_of_inquiry = policy_scope(PypProgrammeOfInquiry).find(params[:id])
          end

          def programme_of_inquiry_params
            params.require(:pyp_programme_of_inquiry).permit(:school_id, :academic_year_id, :coordinator_id, :title, :status, metadata: {})
          end

          def sync_entries!(poi)
            return unless params[:pyp_programme_of_inquiry][:entries].is_a?(Array)

            poi.entries.destroy_all
            params[:pyp_programme_of_inquiry][:entries].each do |entry|
              poi.entries.create!(
                tenant: Current.tenant,
                planning_context_id: entry[:planning_context_id],
                curriculum_document_id: entry[:curriculum_document_id],
                year_level: entry[:year_level],
                theme: entry[:theme],
                title: entry[:title],
                central_idea: entry[:central_idea],
                review_state: entry[:review_state] || "draft",
                coherence_signal: entry[:coherence_signal] || "healthy",
                specialist_expectations: entry[:specialist_expectations] || [],
                metadata: entry[:metadata] || {}
              )
            end
          end
        end
      end
    end
  end
end
