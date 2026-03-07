module Api
  module V1
    module Ib
      class DocumentDuplicationsController < BaseController
        def create
          source = resolve_source
          authorize source, :show?, policy_class: source.is_a?(CurriculumDocument) ? CurriculumDocumentPolicy : IbOperationalRecordPolicy
          planning_context = resolve_planning_context
          duplicated = ::Curriculum::DocumentDuplicationService.new(actor: Current.user, school: current_school_scope).duplicate!(
            source: source,
            planning_context: planning_context,
            title: params[:title],
            carry_forward: ActiveModel::Type::Boolean.new.cast(params[:carry_forward])
          )
          ::Ib::Support::Telemetry.emit(
            event: "ib.document.duplicated",
            tenant: Current.tenant,
            user: Current.user,
            school: current_school_scope,
            metadata: {
              source_ref: ::Ib::RouteBuilder.entity_ref_for(source),
              target_ref: ::Ib::RouteBuilder.entity_ref_for(duplicated),
              carry_forward: ActiveModel::Type::Boolean.new.cast(params[:carry_forward])
            }
          )
          render json: {
            id: duplicated.id,
            entity_ref: ::Ib::RouteBuilder.entity_ref_for(duplicated),
            href: ::Ib::RouteBuilder.href_for(duplicated)
          }, status: :created
        end

        private

        def resolve_source
          case params[:source_type].to_s
          when "curriculum_document"
            policy_scope(CurriculumDocument).find(params[:source_id])
          when "ib_operational_record"
            policy_scope(IbOperationalRecord).find(params[:source_id])
          else
            raise ActiveRecord::RecordNotFound
          end
        end

        def resolve_planning_context
          return nil if params[:planning_context_id].blank?

          policy_scope(PlanningContext).find(params[:planning_context_id])
        end
      end
    end
  end
end
