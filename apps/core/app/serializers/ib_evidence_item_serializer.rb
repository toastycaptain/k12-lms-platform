class IbEvidenceItemSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :planning_context_id, :curriculum_document_id,
    :curriculum_document_version_id, :ib_operational_record_id, :student_id, :created_by_id,
    :programme, :status, :visibility, :contributor_type, :title, :summary, :next_action,
    :story_draft, :metadata, :created_at, :updated_at, :attachment_urls, :entity_ref, :route_id,
    :href, :fallback_route_id, :changed_since_last_seen, :linked_story_count

  def attachment_urls
    object.attachments.map do |attachment|
      Rails.application.routes.url_helpers.rails_blob_url(attachment, only_path: true)
    end
  end

  def entity_ref
    ::Ib::RouteBuilder.entity_ref_for(object)
  end

  def route_id
    ::Ib::RouteBuilder.route_id_for(object)
  end

  def href
    ::Ib::RouteBuilder.href_for(object)
  end

  def fallback_route_id
    ::Ib::RouteBuilder.fallback_route_id_for(object)
  end

  def changed_since_last_seen
    object.updated_at > 3.days.ago
  end

  def linked_story_count
    object.story_links.size
  end
end
