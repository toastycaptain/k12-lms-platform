class IbUserWorkspacePreferenceSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :school_id, :user_id, :surface, :context_key, :preference_key,
    :scope_key, :value, :metadata, :created_at, :updated_at
end
