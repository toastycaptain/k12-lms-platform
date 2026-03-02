module Api
  module V1
    class RolesController < ApplicationController
      before_action :set_role, only: %i[show update destroy]

      def index
        authorize Role
        render json: policy_scope(Role).order(:name)
      end

      def show
        authorize @role
        render json: @role
      end

      def create
        @role = Role.new(role_params)
        @role.tenant = Current.tenant
        authorize @role

        if @role.save
          audit_event(
            "role.created",
            auditable: @role,
            metadata: { role_id: @role.id, role_name: @role.name }
          )
          render json: @role, status: :created
        else
          render json: { errors: @role.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @role
        previous_name = @role.name
        if @role.update(role_params)
          audit_event(
            "role.updated",
            auditable: @role,
            metadata: { role_id: @role.id, previous_name: previous_name, role_name: @role.name }
          )
          render json: @role
        else
          render json: { errors: @role.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @role
        audit_event(
          "role.deleted",
          auditable: @role,
          metadata: { role_id: @role.id, role_name: @role.name }
        )
        @role.destroy!
        head :no_content
      end

      private

      def set_role
        @role = Role.find(params[:id])
      end

      def role_params
        params.require(:role).permit(:name)
      end
    end
  end
end
