module Api
  module V1
    class NotificationsController < ApplicationController
      before_action :set_notification, only: [ :show, :update, :read ]

      def index
        notifications = policy_scope(Notification).order(created_at: :desc)
        notifications = notifications.where(read_at: nil) if ActiveModel::Type::Boolean.new.cast(params[:unread_only])
        notifications = paginate(notifications)
        render json: notifications
      end

      def show
        authorize @notification
        render json: @notification
      end

      def update
        authorize @notification
        if @notification.update(notification_params)
          render json: @notification
        else
          render json: { errors: @notification.errors.full_messages }, status: :unprocessable_content
        end
      end

      def read
        authorize @notification, :read?
        @notification.read!
        render json: @notification
      end

      def unread_count
        authorize Notification, :unread_count?
        count = policy_scope(Notification).unread.count
        render json: { count: count }
      end

      def mark_all_read
        authorize Notification, :mark_all_read?
        updated = policy_scope(Notification).unread.update_all(read_at: Time.current) # rubocop:disable Rails/SkipsModelValidations
        render json: { updated: updated }
      end

      private

      def set_notification
        @notification = Notification.find(params[:id])
      end

      def notification_params
        params.permit(:read_at)
      end
    end
  end
end
