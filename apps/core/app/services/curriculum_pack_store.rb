class CurriculumPackStore
  CACHE_TTL = 10.minutes
  ELIGIBLE_RELEASE_STATUSES = %w[published frozen].freeze

  class << self
    def list(tenant:)
      return system_pack_entries if tenant.nil?

      Rails.cache.fetch(index_cache_key(tenant: tenant), expires_in: CACHE_TTL) do
        merged = system_pack_entries.index_by { |entry| "#{entry[:key]}:#{entry[:version]}" }
        tenant_pack_entries(tenant: tenant).each do |entry|
          merged["#{entry[:key]}:#{entry[:version]}"] = entry
        end

        merged.values.sort_by { |entry| [ entry[:key].to_s, entry[:version].to_s ] }
      end
    end

    def fetch(tenant:, key:, version: nil, with_metadata: false)
      return nil if tenant.nil?
      return nil if key.blank?

      payload = Rails.cache.fetch(
        pack_cache_key(tenant: tenant, key: key, version: version),
        expires_in: CACHE_TTL
      ) do
        fetch_uncached(tenant: tenant, key: key, version: version)
      end

      return nil if payload.nil?

      with_metadata ? payload.deep_dup : payload[:payload].deep_dup
    end

    def exists?(tenant:, key:, version: nil)
      fetch(tenant: tenant, key: key, version: version).present?
    end

    def system_exists?(key, version = nil)
      CurriculumProfileRegistry.exists?(key, version)
    end

    def invalidate_cache!(tenant:)
      return if tenant.nil?

      settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
      settings["curriculum_pack_store_cache_bust"] = settings.fetch("curriculum_pack_store_cache_bust", 0).to_i + 1
      tenant.update_columns(settings: settings, updated_at: Time.current)
    end

    private

    def fetch_uncached(tenant:, key:, version:)
      normalized_key = key.to_s
      normalized_version = version.to_s.presence
      release_scope = CurriculumProfileRelease.unscoped.where(tenant_id: tenant.id, profile_key: normalized_key)

      if normalized_version.present?
        exact_release = release_scope.find_by(profile_version: normalized_version)
        if exact_release
          return nil unless ELIGIBLE_RELEASE_STATUSES.include?(exact_release.status)

          return runtime_record_for_release(exact_release)
        end
      else
        preferred_release = release_scope.where(status: ELIGIBLE_RELEASE_STATUSES).latest_first.first
        return runtime_record_for_release(preferred_release) if preferred_release
      end

      system_profile = CurriculumProfileRegistry.find(normalized_key, normalized_version)
      return runtime_record_for_system(system_profile) if system_profile.present?

      if normalized_key == CurriculumProfileRegistry.default_profile_key
        fallback_profile = CurriculumProfileRegistry.fallback_profile
        return runtime_record_for_system(fallback_profile, source: "fallback") if fallback_profile.present?
      end

      nil
    end

    def runtime_record_for_release(release)
      validation = CurriculumProfileRegistry.validate_profile_payload(release.payload || {})
      return nil unless validation[:valid]

      {
        payload: validation[:normalized_profile],
        source: "tenant_release",
        release_id: release.id,
        release_status: release.status
      }
    end

    def runtime_record_for_system(payload, source: "system")
      {
        payload: payload,
        source: source,
        release_id: nil,
        release_status: nil
      }
    end

    def system_pack_entries
      CurriculumProfileRegistry.all.map do |profile|
        {
          key: profile.dig("identity", "key"),
          version: profile.dig("versioning", "version"),
          label: profile.dig("identity", "label"),
          pack_status: profile["status"],
          compatibility: profile.dig("versioning", "compatibility"),
          release_status: nil,
          source: "system",
          release_id: nil
        }
      end
    end

    def tenant_pack_entries(tenant:)
      CurriculumProfileRelease.unscoped.where(tenant_id: tenant.id).latest_first.filter_map do |release|
        next unless ELIGIBLE_RELEASE_STATUSES.include?(release.status)

        validation = CurriculumProfileRegistry.validate_profile_payload(release.payload || {})
        next unless validation[:valid]

        profile = validation[:normalized_profile]
        {
          key: profile.dig("identity", "key"),
          version: profile.dig("versioning", "version"),
          label: profile.dig("identity", "label"),
          pack_status: profile["status"],
          compatibility: profile.dig("versioning", "compatibility"),
          release_status: release.status,
          source: "tenant_release",
          release_id: release.id
        }
      end
    end

    def index_cache_key(tenant:)
      [
        "curriculum_pack_store_v1",
        tenant.id,
        "index",
        cache_bust(tenant)
      ].join(":")
    end

    def pack_cache_key(tenant:, key:, version:)
      [
        "curriculum_pack_store_v1",
        tenant.id,
        "pack",
        key.to_s,
        version.to_s.presence || "latest",
        cache_bust(tenant)
      ].join(":")
    end

    def cache_bust(tenant)
      settings = tenant.settings.is_a?(Hash) ? tenant.settings : {}
      settings.fetch("curriculum_pack_store_cache_bust", 0).to_i
    end
  end
end
