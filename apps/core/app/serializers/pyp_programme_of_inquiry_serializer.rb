class PypProgrammeOfInquirySerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :academic_year_id, :coordinator_id, :title, :status,
    :metadata, :created_at, :updated_at, :entries

  def entries
    ActiveModelSerializers::SerializableResource.new(object.entries.order(:year_level, :theme)).as_json
  end
end
