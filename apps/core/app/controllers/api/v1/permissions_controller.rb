module Api
  module V1
    class PermissionsController < ApplicationController
      before_action :set_permission, only: [ :update, :destroy ]

      def index
        authorize Permission

        permissions = policy_scope(Permission)
        permissions = permissions.where(role_id: params[:role_id]) if params[:role_id].present?
        permissions = paginate(permissions)

        render json: permissions
      end

      def create
        permission = Permission.new(permission_params)
        permission.tenant = Current.tenant
        authorize permission

        if permission.save
          render json: permission, status: :created
        else
          render json: { errors: permission.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @permission

        if @permission.update(permission_params)
          render json: @permission
        else
          render json: { errors: @permission.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @permission
        @permission.destroy!

        head :no_content
      end

      private

      def set_permission
        @permission = Permission.find(params[:id])
      end

      def permission_params
        params.permit(:role_id, :resource, :action, :granted)
      end
    end
  end
end
