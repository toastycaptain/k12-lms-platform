class LtiResourceLinkSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :lti_registration_id, :title, :description,
    :url, :custom_params, :course_id, :created_at, :updated_at
end
