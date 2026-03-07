module Api
  module V1
    module Ib
      class SpecialistController < BaseController
        def show
          authorize IbDocumentCollaborator
          assignment_payload = ::Ib::Specialist::AssignmentService.new(
            user: Current.user,
            school: current_school_scope
          ).build

          render json: {
            owned_units: assignment_payload[:owned_work].map { |item| legacy_collaborator_payload(item) },
            contributed_units: assignment_payload[:requested_contributions].map { |item| legacy_collaborator_payload(item) },
            week_items: assignment_payload[:pending_responses].map { |item| legacy_operational_payload(item) },
            requested_contributions: assignment_payload[:requested_contributions],
            pending_responses: assignment_payload[:pending_responses],
            evidence_to_sort: assignment_payload[:evidence_to_sort],
            overload_signals: assignment_payload[:overload_signals],
            assignment_gaps: assignment_payload[:assignment_gaps],
            library_items: ::Ib::Specialist::LibraryService.new(user: Current.user, school: current_school_scope).build
          }
        end

        private

        def legacy_collaborator_payload(item)
          {
            id: item[:id],
            title: item[:title],
            detail: item[:detail],
            href: item[:href],
            contribution_mode: item[:contribution_mode]
          }
        end

        def legacy_operational_payload(record)
          {
            id: record[:id],
            title: record[:title],
            detail: record[:detail],
            due_on: record[:due_on],
            href: record[:href]
          }
        end
      end
    end
  end
end
