class CurriculumWorkflowEngine
  class TransitionError < StandardError; end

  TRANSITIONS = {
    "unit_plan" => {
      "submit_for_approval" => {
        from: %w[draft],
        to: "pending_approval",
        roles: %w[admin curriculum_lead teacher]
      },
      "publish" => {
        from: %w[draft pending_approval],
        to: "published",
        roles: %w[admin curriculum_lead teacher]
      },
      "archive" => {
        from: %w[published],
        to: "archived",
        roles: %w[admin curriculum_lead teacher]
      }
    },
    "template" => {
      "publish" => {
        from: %w[draft],
        to: "published",
        roles: %w[admin curriculum_lead teacher]
      },
      "archive" => {
        from: %w[published],
        to: "archived",
        roles: %w[admin curriculum_lead teacher]
      }
    },
    "lesson_plan" => {
      "publish" => {
        from: %w[draft],
        to: "published",
        roles: %w[admin curriculum_lead teacher]
      }
    }
  }.freeze

  class << self
    def transition!(record:, event:, actor:, context: {})
      workflow_key = workflow_key_for(record)
      config = TRANSITIONS.dig(workflow_key, event.to_s)
      raise TransitionError, "Unsupported transition #{workflow_key}.#{event}" if config.nil?

      unless role_allowed?(actor, config[:roles])
        raise TransitionError, "Role not permitted for transition #{workflow_key}.#{event}"
      end

      status = record.status.to_s
      unless config[:from].include?(status)
        raise TransitionError, "Cannot transition #{workflow_key} from '#{status}' using '#{event}'"
      end

      if event.to_s == "publish" && context[:approval_required] && status == "draft"
        raise TransitionError, "Approval is required. Use submit_for_approval instead."
      end

      record.status = config[:to]
      record.save!

      apply_side_effects(record: record, event: event.to_s, actor: actor)
      record
    end

    private

    def workflow_key_for(record)
      case record
      when UnitPlan
        "unit_plan"
      when Template
        "template"
      when LessonPlan
        "lesson_plan"
      else
        raise TransitionError, "Unknown workflow object #{record.class.name}"
      end
    end

    def role_allowed?(actor, roles)
      return false unless actor

      roles.any? { |role| actor.has_role?(role) }
    end

    def apply_side_effects(record:, event:, actor:)
      case [ record.class.name, event ]
      when [ "UnitPlan", "submit_for_approval" ]
        record.approvals.create!(
          tenant: record.tenant,
          requested_by: actor,
          status: "pending"
        )
      when [ "UnitPlan", "publish" ]
        Approval.where(approvable: record, status: "pending").update_all(status: "approved", updated_at: Time.current)
      end
    end
  end
end
