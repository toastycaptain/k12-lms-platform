module Ib
  module Specialist
    class ContributionPermissionService
      MODE_MATRIX = {
        "owner" => %w[full comment evidence resource support_note],
        "co_planner" => %w[full comment evidence resource support_note],
        "specialist_contributor" => %w[comment evidence resource support_note],
        "reviewer" => %w[comment],
        "advisor" => %w[comment support_note]
      }.freeze

      def initialize(user:, collaborator: nil)
        @user = user
        @collaborator = collaborator
      end

      def allowed_modes
        return %w[full comment evidence resource support_note] if privileged?
        return [] if collaborator.nil?

        MODE_MATRIX.fetch(collaborator.role, %w[comment])
      end

      def allowed?(mode)
        allowed_modes.include?(mode.to_s)
      end

      private

      attr_reader :user, :collaborator

      def privileged?
        user.has_role?(:admin) || user.has_role?(:curriculum_lead) || user.has_role?(:teacher)
      end
    end
  end
end
