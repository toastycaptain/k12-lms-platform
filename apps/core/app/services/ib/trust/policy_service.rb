module Ib
  module Trust
    class PolicyService
      TRUST_FRAMEWORK = {
        digest_only: "Routine updates should batch into digest windows.",
        immediate: "Urgent risk, safety, or same-day action items can bypass digest cadence.",
        quiet_hours_safe: "Guardians and students should not receive routine traffic during quiet hours.",
        acknowledgement_required: "Formal reports and conference materials can require explicit acknowledgement."
      }.freeze

      def initialize(tenant:, school: nil, actor: nil)
        @tenant = tenant
        @school = school
        @actor = actor
      end

      def index_payload
        {
          generated_at: Time.current.utc.iso8601,
          trust_framework: TRUST_FRAMEWORK,
          policies: policy_scope.order(:audience, :content_type).map { |policy| serialize_policy(policy) },
          delivery_summary: delivery_summary
        }
      end

      def upsert_policy!(attrs)
        policy = attrs[:id].present? ? policy_scope.find(attrs[:id]) : policy_scope.find_or_initialize_by(audience: attrs[:audience], content_type: attrs[:content_type])
        policy.assign_attributes(
          school: school,
          created_by: actor || policy.created_by,
          audience: attrs[:audience].presence || policy.audience || "guardian",
          content_type: attrs[:content_type].presence || policy.content_type || "story",
          status: attrs[:status].presence || policy.status || "active",
          cadence_mode: attrs[:cadence_mode].presence || policy.cadence_mode || "weekly_digest",
          delivery_mode: attrs[:delivery_mode].presence || policy.delivery_mode || "digest",
          approval_mode: attrs[:approval_mode].presence || policy.approval_mode || "teacher_reviewed",
          policy_rules: policy.policy_rules.merge(normalize_hash(attrs[:policy_rules])),
          privacy_rules: policy.privacy_rules.merge(normalize_hash(attrs[:privacy_rules])),
          localization_rules: policy.localization_rules.merge(normalize_hash(attrs[:localization_rules])),
          metadata: policy.metadata.merge(normalize_hash(attrs[:metadata]))
        )
        policy.save!
        serialize_policy(policy)
      end

      private

      attr_reader :tenant, :school, :actor

      def policy_scope
        scope = IbTrustPolicy.where(tenant_id: tenant.id)
        scope = scope.where(school_id: [ school&.id, nil ].compact) if school
        scope
      end

      def delivery_summary
        receipts = IbDeliveryReceipt.where(tenant_id: tenant.id)
        receipts = receipts.where(school_id: school.id) if school
        preferences = IbCommunicationPreference.where(tenant_id: tenant.id)
        preferences = preferences.where(school_id: school.id) if school
        {
          receipts_total: receipts.count,
          acknowledged: receipts.where(state: "acknowledged").count,
          quiet_hours_prefs: preferences.where.not(quiet_hours_start: nil).count,
          cadence_modes: preferences.group(:digest_cadence).count
        }
      end

      def serialize_policy(policy)
        {
          id: policy.id,
          audience: policy.audience,
          content_type: policy.content_type,
          status: policy.status,
          cadence_mode: policy.cadence_mode,
          delivery_mode: policy.delivery_mode,
          approval_mode: policy.approval_mode,
          policy_rules: policy.policy_rules,
          privacy_rules: policy.privacy_rules,
          localization_rules: policy.localization_rules,
          updated_at: policy.updated_at.utc.iso8601
        }
      end

      def normalize_hash(value)
        value.is_a?(Hash) ? value.deep_stringify_keys : {}
      end
    end
  end
end
