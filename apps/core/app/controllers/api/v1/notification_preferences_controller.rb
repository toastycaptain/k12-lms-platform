module Api
  module V1
    class NotificationPreferencesController < ApplicationController
      def index
        authorize NotificationPreference
        policy_scope(NotificationPreference)
        render json: serialized_preferences(NotificationPreference.for_user(Current.user))
      end

      def update
        authorize NotificationPreference, :update?

        event_type = params[:event_type].to_s
        unless NotificationPreference::EVENT_TYPES.key?(event_type)
          render json: { errors: [ "Unknown event type" ] }, status: :unprocessable_content
          return
        end

        preference = policy_scope(NotificationPreference).find_or_initialize_by(event_type: event_type)
        preference.tenant ||= Current.tenant
        preference.user ||= Current.user
        preference.assign_attributes(preference_attributes)

        if preference.save
          render json: preference
        else
          render json: { errors: preference.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def preference_attributes
        attrs = params.permit(:in_app, :email, :email_frequency).to_h
        email_present = attrs.key?("email")
        email_enabled = ActiveModel::Type::Boolean.new.cast(attrs["email"])

        if email_present && !email_enabled && !attrs.key?("email_frequency")
          attrs["email_frequency"] = "never"
        end

        attrs
      end

      def serialized_preferences(preferences)
        preferences.map do |event_type, value|
          {
            event_type: event_type,
            event_name: NotificationPreference.event_name(event_type),
            in_app: value[:in_app],
            email: value[:email],
            email_frequency: value[:email_frequency]
          }
        end
      end
    end
  end
end
