module Api
  module V1
    module Ib
      class CommunicationPreferencesController < BaseController
        def show
          record = preference_record
          authorize record
          render json: serialize_preference(record)
        end

        def update
          record = preference_record
          authorize record
          record.update!(
            locale: preference_params[:locale].presence || record.locale,
            digest_cadence: preference_params[:digest_cadence].presence || record.digest_cadence,
            quiet_hours_start: preference_params[:quiet_hours_start].presence || record.quiet_hours_start,
            quiet_hours_end: preference_params[:quiet_hours_end].presence || record.quiet_hours_end,
            quiet_hours_timezone: preference_params[:quiet_hours_timezone].presence || record.quiet_hours_timezone,
            delivery_rules: record.delivery_rules.merge((preference_params[:delivery_rules] || {}).to_h.deep_stringify_keys),
            metadata: record.metadata.merge((preference_params[:metadata] || {}).to_h.deep_stringify_keys)
          )
          render json: serialize_preference(record)
        end

        private

        def preference_record
          @preference_record ||= IbCommunicationPreference.find_or_create_by!(
            tenant: Current.tenant,
            school: current_school_scope,
            user: Current.user,
            audience: params[:audience].presence || "guardian"
          )
        end

        def preference_params
          params.fetch(:ib_communication_preference, params).permit(
            :locale,
            :digest_cadence,
            :quiet_hours_start,
            :quiet_hours_end,
            :quiet_hours_timezone,
            delivery_rules: {},
            metadata: {}
          )
        end

        def serialize_preference(record)
          {
            id: record.id,
            audience: record.audience,
            locale: record.locale,
            digest_cadence: record.digest_cadence,
            quiet_hours_start: record.quiet_hours_start,
            quiet_hours_end: record.quiet_hours_end,
            quiet_hours_timezone: record.quiet_hours_timezone,
            delivery_rules: record.delivery_rules,
            metadata: record.metadata,
            updated_at: record.updated_at.utc.iso8601
          }
        end
      end
    end
  end
end
