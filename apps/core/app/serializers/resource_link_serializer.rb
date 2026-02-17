class ResourceLinkSerializer < ActiveModel::Serializer
  attributes :id, :linkable_type, :linkable_id, :url, :title, :mime_type,
    :drive_file_id, :provider, :link_type, :metadata, :created_at, :updated_at
end
