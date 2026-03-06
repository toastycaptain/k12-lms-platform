class IbStandardsExportSerializer < ActiveModel::Serializer
  attributes :id, :school_id, :ib_standards_cycle_id, :ib_standards_packet_id, :initiated_by_id,
    :status, :snapshot_payload, :metadata, :started_at, :finished_at, :error_message, :created_at,
    :updated_at, :artifact_url

  def artifact_url
    return nil unless object.artifact.attached?

    Rails.application.routes.url_helpers.rails_blob_url(object.artifact, only_path: true)
  end
end
