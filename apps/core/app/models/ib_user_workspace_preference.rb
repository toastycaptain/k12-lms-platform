class IbUserWorkspacePreference < ApplicationRecord
  include TenantScoped

  belongs_to :school, optional: true
  belongs_to :user

  validates :surface, :context_key, :preference_key, :scope_key, presence: true

  scope :for_scope, ->(scope_key) { where(scope_key: scope_key) }
  scope :for_surface, ->(surface) { where(surface: surface) }

  class << self
    def scope_key_for(user:, school: nil, programme: nil, role: nil)
      [
        school ? "school:#{school.id}" : "all-schools",
        programme.presence || "mixed",
        role.presence || inferred_role_for(user)
      ].join("|")
    end

    def read_value(user:, school: nil, surface:, context_key:, preference_key:, programme: nil, role: nil)
      record = find_by(preference_lookup_attributes(user:, school:, surface:, context_key:, preference_key:, programme:, role:))
      record&.value || {}
    end

    def write_value!(user:, school: nil, surface:, context_key:, preference_key:, value:, metadata: {}, programme: nil, role: nil)
      lookup_attributes = preference_lookup_attributes(
        user:,
        school:,
        surface:,
        context_key:,
        preference_key:,
        programme:,
        role:
      )
      normalized_value = normalize_value(value)
      normalized_metadata = metadata.to_h.deep_stringify_keys

      record = new(
        lookup_attributes.merge(
          user:,
          school:,
          value: normalized_value,
          metadata: normalized_metadata
        )
      )
      record.validate!

      upsert(
        lookup_attributes.merge(
          value: normalized_value,
          metadata: normalized_metadata
        ),
        unique_by: :idx_ib_workspace_preferences_scope,
        update_only: %i[school_id value metadata]
      )

      find_by!(lookup_attributes)
    end

    private

    def preference_lookup_attributes(user:, school:, surface:, context_key:, preference_key:, programme:, role:)
      {
        tenant_id: user.tenant_id,
        user_id: user.id,
        school_id: school&.id,
        surface: surface,
        context_key: context_key,
        preference_key: preference_key,
        scope_key: scope_key_for(user: user, school: school, programme: programme, role: role)
      }
    end

    def normalize_value(value)
      case value
      when Hash
        value.deep_stringify_keys
      when Array
        value.map { |entry| entry.is_a?(Hash) ? entry.deep_stringify_keys : entry }
      else
        { "value" => value }
      end
    end

    def inferred_role_for(user)
      return "admin" if user.has_role?(:admin)
      return "curriculum_lead" if user.has_role?(:curriculum_lead)
      return "guardian" if user.has_role?(:guardian)
      return "student" if user.has_role?(:student)
      return "teacher" if user.has_role?(:teacher)

      "user"
    end
  end
end
