module Ib
  module Mobile
    class ActionScopeService
      ROLE_ORDER = %w[teacher specialist coordinator guardian].freeze

      INVENTORY = {
        "teacher" => {
          mobile_first: [
            {
              key: "capture_evidence",
              label: "Capture evidence",
              detail: "Upload evidence, tag it, and attach it before the next class starts.",
              href: "/ib/evidence",
              route_id: "ib.evidence"
            },
            {
              key: "review_reflection",
              label: "Review reflection",
              detail: "Approve or return the latest student response without opening the full studio.",
              href: "/ib/evidence",
              route_id: "ib.evidence"
            },
            {
              key: "publish_story",
              label: "Queue family update",
              detail: "Preview, hold, or schedule the next family-facing story.",
              href: "/ib/families/publishing",
              route_id: "ib.families.publishing"
            }
          ],
          desktop_first: [
            {
              key: "full_unit_edit",
              label: "Full unit studio",
              detail: "Large-section planning edits and multi-document carry forward remain desktop-first.",
              href: "/ib/planning",
              route_id: "ib.planning"
            }
          ]
        },
        "specialist" => {
          mobile_first: [
            {
              key: "specialist_handoff",
              label: "Answer specialist handoff",
              detail: "Respond to the next contribution request between classes.",
              href: "/ib/specialist",
              route_id: "ib.specialist"
            },
            {
              key: "rapid_attach",
              label: "Rapid attach evidence",
              detail: "Capture one observation and attach it to the right unit or project.",
              href: "/ib/evidence",
              route_id: "ib.evidence"
            }
          ],
          desktop_first: [
            {
              key: "library_curate",
              label: "Curate library assets",
              detail: "Cross-grade asset management and large-batch reuse stay desktop-first.",
              href: "/ib/specialist",
              route_id: "ib.specialist"
            }
          ]
        },
        "coordinator" => {
          mobile_first: [
            {
              key: "exception_triage",
              label: "Triage exception",
              detail: "Open the highest-signal exception and route to the right queue.",
              href: "/ib/operations",
              route_id: "ib.operations"
            },
            {
              key: "review_decision",
              label: "Handle approval",
              detail: "Approve, return, or reassign a queued review item.",
              href: "/ib/review",
              route_id: "ib.review"
            }
          ],
          desktop_first: [
            {
              key: "whole_school_analysis",
              label: "Whole-school analysis",
              detail: "Large intelligence and reporting reviews remain desktop-first.",
              href: "/ib/operations",
              route_id: "ib.operations"
            }
          ]
        },
        "guardian" => {
          mobile_first: [
            {
              key: "read_family_story",
              label: "Read story",
              detail: "Open the latest learning story and support prompt.",
              href: "/ib/families/stories",
              route_id: "ib.guardian"
            },
            {
              key: "acknowledge_report",
              label: "Acknowledge report",
              detail: "Read or acknowledge the latest released report from the same mobile feed.",
              href: "/ib/guardian",
              route_id: "ib.guardian"
            }
          ],
          desktop_first: [
            {
              key: "archive_review",
              label: "Review archives",
              detail: "Longer archive browsing and export downloads remain desktop-first.",
              href: "/ib/guardian",
              route_id: "ib.guardian"
            }
          ]
        }
      }.freeze

      DEEP_LINKS = {
        "teacher" => [
          {
            key: "evidence_triage",
            event_key: "ib.mobile.evidence.pending",
            href: "/ib/evidence",
            route_id: "ib.evidence",
            restore_key: "evidence_triage"
          },
          {
            key: "publishing_queue",
            event_key: "ib.mobile.story.pending",
            href: "/ib/families/publishing",
            route_id: "ib.families.publishing",
            restore_key: "publishing_queue"
          }
        ],
        "specialist" => [
          {
            key: "specialist_handoff",
            event_key: "ib.mobile.specialist.awaiting_response",
            href: "/ib/specialist",
            route_id: "ib.specialist",
            restore_key: "specialist_handoff"
          }
        ],
        "coordinator" => [
          {
            key: "operations_exception",
            event_key: "ib.mobile.exception.risk",
            href: "/ib/operations",
            route_id: "ib.operations",
            restore_key: "operations_exception"
          },
          {
            key: "review_queue",
            event_key: "ib.mobile.review.pending",
            href: "/ib/review",
            route_id: "ib.review",
            restore_key: "review_queue"
          }
        ],
        "guardian" => [
          {
            key: "family_home",
            event_key: "ib.mobile.family.update",
            href: "/ib/guardian",
            route_id: "ib.guardian",
            restore_key: "family_home"
          }
        ]
      }.freeze

      OFFLINE_POLICY = {
        draft_queue_limit: 40,
        resumable_uploads: true,
        background_sync: "best_effort",
        attachment_retry: true,
        conflict_resolution: "explicit_dialog",
        low_bandwidth_mode: true,
        retry_backoff_seconds: [ 5, 30, 120 ]
      }.freeze

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        diagnostics = ::Ib::Mobile::TrustService.new(
          tenant: user.tenant,
          school: school,
          actor: user
        ).index_payload

        {
          generated_at: Time.current.utc.iso8601,
          school_label: school&.name || "All schools",
          role: actor_role,
          primary_actions: serialize_actions(role_inventory.fetch(:mobile_first)),
          desktop_first_actions: serialize_actions(role_inventory.fetch(:desktop_first)),
          role_inventory: INVENTORY.transform_values do |value|
            {
              mobile_first: serialize_actions(value.fetch(:mobile_first)),
              desktop_first: serialize_actions(value.fetch(:desktop_first))
            }
          end,
          deep_links: DEEP_LINKS.fetch(actor_role, []).map { |row| row.merge(mobile_restore: true) },
          offline_policy: OFFLINE_POLICY,
          diagnostics: {
            trust_contract: diagnostics[:trust_contract],
            success_criteria: diagnostics[:success_criteria],
            diagnostic_count: Array(diagnostics[:diagnostics]).count,
            unhealthy_count: Array(diagnostics[:diagnostics]).count do |row|
              !%w[healthy syncing].include?(row[:status])
            end
          }
        }
      end

      private

      attr_reader :user, :school

      def actor_role
        return "guardian" if user.has_role?(:guardian)
        return "specialist" if user.has_role?(:specialist)
        return "coordinator" if coordinator_role?

        "teacher"
      end

      def coordinator_role?
        user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:district_admin)
      end

      def role_inventory
        INVENTORY.fetch(actor_role)
      end

      def serialize_actions(rows)
        rows.map do |row|
          {
            key: row.fetch(:key),
            label: row.fetch(:label),
            detail: row.fetch(:detail),
            href: row.fetch(:href),
            route_id: row.fetch(:route_id)
          }
        end
      end
    end
  end
end
