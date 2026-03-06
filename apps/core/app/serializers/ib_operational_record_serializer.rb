class IbOperationalRecordSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :planning_context_id, :curriculum_document_id, :student_id,
    :owner_id, :advisor_id, :programme, :record_family, :subtype, :status, :priority, :risk_level,
    :due_on, :title, :summary, :next_action, :route_hint, :metadata, :created_at, :updated_at,
    :curriculum_document_title, :student_name, :owner_name, :advisor_name, :checkpoints,
    :entity_ref, :route_id, :href, :fallback_route_id, :changed_since_last_seen

  def checkpoints
    ActiveModelSerializers::SerializableResource.new(object.checkpoints.order(:position)).as_json
  end

  def curriculum_document_title
    object.curriculum_document&.title
  end

  def student_name
    full_name_for(object.student)
  end

  def owner_name
    full_name_for(object.owner)
  end

  def advisor_name
    full_name_for(object.advisor)
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

  private

  def full_name_for(user)
    return nil if user.nil?

    [ user.first_name, user.last_name ].compact.join(" ").strip.presence || user.email
  end
end
