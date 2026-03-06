module Api
  module V1
    module Ib
      class SpecialistController < BaseController
        def show
          authorize IbDocumentCollaborator
          collaborators = policy_scope(IbDocumentCollaborator).active.where(role: [ "specialist_contributor", "co_planner" ]).includes(:curriculum_document)
          owned = collaborators.select { |item| item.user_id == Current.user.id }
          contributed = collaborators.reject { |item| item.user_id == Current.user.id }
          week_items = policy_scope(IbOperationalRecord).where(record_family: "specialist").order(due_on: :asc, updated_at: :desc).limit(5)

          render json: {
            owned_units: owned.map { |item| collaborator_payload(item) },
            contributed_units: contributed.first(6).map { |item| collaborator_payload(item) },
            week_items: week_items.map { |record| operational_payload(record) }
          }
        end

        private

        def collaborator_payload(item)
          {
            id: item.id,
            title: item.curriculum_document&.title || "Document",
            detail: item.metadata["detail"].presence || "#{item.role.humanize} contribution",
            href: ::Ib::RouteBuilder.href_for(item.curriculum_document),
            contribution_mode: item.contribution_mode
          }
        end

        def operational_payload(record)
          {
            id: record.id,
            title: record.title,
            detail: record.next_action.presence || record.summary,
            due_on: record.due_on,
            href: ::Ib::RouteBuilder.href_for(record)
          }
        end
      end
    end
  end
end
