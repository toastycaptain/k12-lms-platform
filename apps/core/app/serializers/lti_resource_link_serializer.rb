class LtiResourceLinkSerializer < ActiveModel::Serializer
  attributes :id, :lti_registration_id, :course_id, :title, :description,
             :url, :custom_params, :tenant_id, :created_at, :updated_at
end
