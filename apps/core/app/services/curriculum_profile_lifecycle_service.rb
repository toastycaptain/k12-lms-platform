class CurriculumProfileLifecycleService
  class LifecycleError < StandardError; end

  attr_reader :tenant, :actor

  def initialize(tenant:, actor:)
    @tenant = tenant
    @actor = actor
  end

  def validate_payload(payload)
    CurriculumProfileRegistry.validate_profile_payload(payload)
  end

  def import!(payload:, checksum: nil, metadata: {})
    validation = validate_payload(payload)
    unless validation[:valid]
      raise LifecycleError, "Profile payload failed validation: #{validation[:errors].join(', ')}"
    end

    normalized = validation[:normalized_profile]
    key = normalized.dig("identity", "key")
    version = normalized.dig("versioning", "version")

    release = CurriculumProfileRelease.find_or_initialize_by(
      tenant_id: tenant.id,
      profile_key: key,
      profile_version: version
    )

    release.assign_attributes(
      imported_by: actor,
      checksum: checksum,
      payload: normalized,
      metadata: release.metadata.merge(metadata),
      status: release.status.presence || "draft"
    )
    release.save!

    release
  end

  def publish!(profile_key:, profile_version:, metadata: {})
    release = load_release!(profile_key: profile_key, profile_version: profile_version)

    CurriculumProfileRelease.where(tenant_id: tenant.id, profile_key: profile_key, status: "published").where.not(id: release.id).find_each do |existing|
      existing.update!(status: "deprecated", deprecated_at: Time.current)
    end

    release.update!(
      status: "published",
      published_at: Time.current,
      metadata: release.metadata.merge(metadata)
    )

    settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
    settings["curriculum_default_profile_key"] = profile_key
    settings["curriculum_default_profile_version"] = profile_version
    tenant.update!(settings: settings)

    CurriculumProfileResolver.invalidate_cache!(tenant: tenant)
    release
  end

  def deprecate!(profile_key:, profile_version:, metadata: {})
    release = load_release!(profile_key: profile_key, profile_version: profile_version)
    release.update!(
      status: "deprecated",
      deprecated_at: Time.current,
      metadata: release.metadata.merge(metadata)
    )

    CurriculumProfileResolver.invalidate_cache!(tenant: tenant)
    release
  end

  def freeze!(profile_key:, profile_version:, metadata: {})
    release = load_release!(profile_key: profile_key, profile_version: profile_version)
    release.update!(
      status: "frozen",
      frozen_at: Time.current,
      metadata: release.metadata.merge(metadata)
    )

    CurriculumProfileResolver.invalidate_cache!(tenant: tenant)
    release
  end

  def rollback!(profile_key:, profile_version:, rollback_to_version:, metadata: {})
    from_release = load_release!(profile_key: profile_key, profile_version: profile_version)
    target_release = load_release!(profile_key: profile_key, profile_version: rollback_to_version)

    from_release.update!(
      status: "rolled_back",
      rolled_back_from_version: rollback_to_version,
      metadata: from_release.metadata.merge(metadata)
    )

    target_release.update!(
      status: "published",
      published_at: Time.current,
      metadata: target_release.metadata.merge("rolled_back_from" => profile_version)
    )

    settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
    settings["curriculum_default_profile_key"] = profile_key
    settings["curriculum_default_profile_version"] = rollback_to_version
    tenant.update!(settings: settings)

    CurriculumProfileResolver.invalidate_cache!(tenant: tenant)
    target_release
  end

  private

  def load_release!(profile_key:, profile_version:)
    CurriculumProfileRelease.find_by!(
      tenant_id: tenant.id,
      profile_key: profile_key,
      profile_version: profile_version
    )
  rescue ActiveRecord::RecordNotFound
    raise LifecycleError, "Release #{profile_key}@#{profile_version} not found"
  end
end
