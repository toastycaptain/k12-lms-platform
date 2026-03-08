require "stringio"
require "digest"

module Ib
  module Standards
    class ExportService
      class << self
        def enqueue!(packet:, initiated_by:)
          snapshot = snapshot_for(packet)
          snapshot_digest = Digest::SHA256.hexdigest(snapshot.to_json)
          existing = packet.exports.where(status: %w[queued running succeeded]).find do |export|
            export.metadata.to_h["snapshot_digest"] == snapshot_digest
          end
          return existing if existing.present?

          export = packet.exports.create!(
            tenant: packet.tenant,
            school: packet.school,
            ib_standards_cycle: packet.ib_standards_cycle,
            initiated_by: initiated_by,
            snapshot_payload: snapshot,
            metadata: {
              "snapshot_digest" => snapshot_digest,
              "route_id" => ::Ib::RouteBuilder.route_id_for(packet),
              "route_href" => ::Ib::RouteBuilder.href_for(packet)
            }
          )
          packet.update!(export_status: "ready")
          ::Ib::Support::Telemetry.emit(
            event: "ib.standards.export.enqueued",
            tenant: packet.tenant,
            user: initiated_by,
            school: packet.school,
            metadata: { packet_id: packet.id, cycle_id: packet.ib_standards_cycle_id }
          )
          job = ExportJob.perform_later(export.id)
          ::Ib::Support::OperationalJobTracker.register_enqueue!(
            job: job,
            operation_key: "standards_export",
            tenant: packet.tenant,
            school: packet.school,
            actor: initiated_by,
            source_record: export,
            payload: {
              export_id: export.id,
              packet_id: packet.id,
              cycle_id: packet.ib_standards_cycle_id
            },
            idempotency_key: snapshot_digest
          )
          export
        end

        def perform!(export)
          export.update!(status: "running", started_at: Time.current)
          packet = export.ib_standards_packet
          snapshot = export.snapshot_payload.deep_dup
          io = StringIO.new(JSON.pretty_generate(snapshot))
          export.artifact.attach(
            io: io,
            filename: "ib-standards-packet-#{packet.id}-#{Time.current.to_i}.json",
            content_type: "application/json"
          )
          packet.update!(
            export_status: "exported",
            review_state: packet.review_state == "approved" ? "approved" : "in_review",
            evidence_strength: snapshot.dig("score", "evidence_strength") || packet.evidence_strength
          )
          export.update!(status: "succeeded", finished_at: Time.current)
          ::Ib::Support::Telemetry.emit(
            event: "ib.standards.export.succeeded",
            tenant: packet.tenant,
            user: export.initiated_by,
            school: packet.school,
            metadata: { packet_id: packet.id, export_id: export.id }
          )
          export
        rescue StandardError => e
          export.update!(status: "failed", finished_at: Time.current, error_message: e.message)
          ::Ib::Support::Telemetry.emit(
            event: "ib.standards.export.failed",
            tenant: export.tenant,
            user: export.initiated_by,
            school: export.school,
            metadata: { packet_id: export.ib_standards_packet_id, export_id: export.id, message: e.message }
          )
          raise
        end

        private

        def snapshot_for(packet)
          {
            packet: {
              id: packet.id,
              code: packet.code,
              title: packet.title,
              review_state: packet.review_state,
              reviewer_id: packet.reviewer_id,
              owner_id: packet.owner_id
            },
            score: ScoringService.packet_summary(packet),
            items: packet.items.map do |item|
              {
                id: item.id,
                source_type: item.source_type,
                source_id: item.source_id,
                review_state: item.review_state,
                summary: item.summary,
                provenance_href: provenance_href_for(item)
              }
            end
          }
        end

        def provenance_href_for(item)
          source = item.source_type.safe_constantize&.unscoped&.find_by(id: item.source_id)
          return nil if source.nil?

          ::Ib::RouteBuilder.href_for(source)
        end
      end

      class ExportJob < ApplicationJob
        queue_as :ib_exports
        retry_on StandardError, wait: 15.seconds, attempts: 3

        def perform(export_id)
          export = IbStandardsExport.find(export_id)
          ExportService.perform!(export)
        end
      end
    end
  end
end
