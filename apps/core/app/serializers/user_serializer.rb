class UserSerializer < ActiveModel::Serializer
  attributes :id, :email, :first_name, :last_name, :tenant_id, :roles, :created_at, :updated_at

  def roles
    object.role_names
  end
end
