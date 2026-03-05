class SchoolSerializer < ActiveModel::Serializer
  attributes :id, :name, :address, :timezone,
             :curriculum_profile_key, :curriculum_profile_version,
             :effective_curriculum_profile_key, :effective_curriculum_profile_version, :effective_curriculum_source,
             :tenant_id, :created_at, :updated_at

  def curriculum_profile_key
    return object.curriculum_profile_key if admin_scope?

    nil
  end

  def curriculum_profile_version
    return object.curriculum_profile_version if admin_scope?

    nil
  end

  def effective_curriculum_profile_key
    resolved_context[:profile_key]
  end

  def effective_curriculum_profile_version
    resolved_context[:resolved_profile_version] || resolved_context[:profile_version]
  end

  def effective_curriculum_source
    resolved_context[:source]
  end

  private

  def admin_scope?
    scope&.has_role?(:admin)
  end

  def resolved_context
    @resolved_context ||= CurriculumProfileResolver.resolve(
      tenant: Current.tenant || object.tenant,
      school: object
    )
  end
end
