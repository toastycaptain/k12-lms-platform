module Api
  module V1
    module Ib
      class StandardsPacketsController < BaseController
        before_action :set_packet, only: [ :show, :update, :export, :export_preview, :comparison, :assign_reviewer, :approve, :return_packet ]

        def index
          authorize IbStandardsPacket
          packets = policy_scope(IbStandardsPacket).includes(:items).order(updated_at: :desc)
          packets = packets.where(ib_standards_cycle_id: params[:ib_standards_cycle_id]) if params[:ib_standards_cycle_id].present?
          render json: packets
        end

        def show
          authorize @packet
          render json: @packet
        end

        def create
          authorize IbStandardsPacket
          packet = IbStandardsPacket.create!(packet_params.merge(
            tenant: Current.tenant,
            school_id: current_school_scope&.id || packet_params.fetch(:school_id)
          ))
          sync_items!(packet)
          sync_score!(packet)
          render json: packet, status: :created
        end

        def update
          authorize @packet
          @packet.update!(packet_params)
          sync_items!(@packet)
          sync_score!(@packet)
          render json: @packet
        end

        def export
          authorize @packet
          export = ::Ib::Standards::ExportService.enqueue!(packet: @packet, initiated_by: Current.user)
          render json: export, serializer: IbStandardsExportSerializer, status: :accepted
        end

        def export_preview
          authorize @packet
          render json: {
            packet_id: @packet.id,
            preview: ::Ib::Standards::ExportService.send(:snapshot_for, @packet)
          }
        end

        def comparison
          authorize @packet
          render json: {
            current_packet_id: @packet.id,
            previous_packet: previous_packet_payload
          }
        end

        def assign_reviewer
          authorize @packet
          @packet.update!(reviewer_id: params.require(:reviewer_id))
          render json: @packet
        end

        def approve
          authorize @packet
          @packet.update!(review_state: "approved", export_status: "ready")
          render json: @packet
        end

        def return_packet
          authorize @packet
          metadata = @packet.metadata.is_a?(Hash) ? @packet.metadata.deep_dup : {}
          metadata["return_reason"] = params[:reason].to_s
          @packet.update!(review_state: "returned", metadata: metadata)
          render json: @packet
        end

        private

        def set_packet
          @packet = policy_scope(IbStandardsPacket).find(params[:id])
        end

        def packet_params
          params.require(:ib_standards_packet).permit(
            :school_id, :ib_standards_cycle_id, :owner_id, :reviewer_id, :code, :title, :review_state,
            :evidence_strength, :export_status, metadata: {}
          )
        end

        def sync_items!(packet)
          return unless params[:ib_standards_packet][:items].is_a?(Array)

          packet.items.destroy_all
          params[:ib_standards_packet][:items].each do |item|
            packet.items.create!(
              tenant: Current.tenant,
              source_type: item[:source_type],
              source_id: item[:source_id],
              review_state: item[:review_state] || "draft",
              summary: item[:summary],
              relevance_note: item[:relevance_note],
              metadata: item[:metadata] || {}
            )
          end
        end

        def sync_score!(packet)
          summary = packet.score_summary
          packet.update_columns(evidence_strength: summary[:evidence_strength], updated_at: Time.current)
        end

        def previous_packet_payload
          previous_cycle = policy_scope(IbStandardsCycle)
                            .where(school_id: @packet.school_id)
                            .where.not(id: @packet.ib_standards_cycle_id)
                            .order(created_at: :desc)
                            .first
          return nil unless previous_cycle

          previous_packet = previous_cycle.packets.find_by(code: @packet.code)
          return nil unless previous_packet

          {
            id: previous_packet.id,
            cycle_id: previous_cycle.id,
            title: previous_packet.title,
            review_state: previous_packet.review_state,
            evidence_strength: previous_packet.evidence_strength,
            export_status: previous_packet.export_status,
            score_summary: previous_packet.score_summary
          }
        end
      end
    end
  end
end
