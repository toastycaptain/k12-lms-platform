module Api
  module V1
    class UsersController < ApplicationController
      before_action :set_user, only: [ :show, :update, :destroy ]

      def index
        authorize User
        users = policy_scope(User).order(:last_name, :first_name)
        users = users.joins(:roles).where(roles: { name: params[:role] }) if params[:role].present?
        render json: users
      end

      def show
        authorize @user
        render json: @user
      end

      def create
        @user = User.new(user_params.except(:roles))
        @user.tenant = Current.tenant
        authorize @user

        if @user.save
          apply_roles(@user, user_params[:roles])
          render json: @user, status: :created
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @user
        if @user.update(user_params.except(:roles))
          apply_roles(@user, user_params[:roles]) if user_params.key?(:roles)
          render json: @user
        else
          render json: { errors: @user.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @user
        @user.destroy!
        head :no_content
      end

      private

      def set_user
        @user = User.find(params[:id])
      end

      def user_params
        params.require(:user).permit(:email, :first_name, :last_name, roles: [])
      end

      def apply_roles(user, role_names)
        user.user_roles.destroy_all
        Array(role_names).each do |role_name|
          user.add_role(role_name)
        end
      end
    end
  end
end
