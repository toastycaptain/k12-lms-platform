module Api
  module V1
    module Ib
      class ProgrammeSettingsController < BaseController
        def index
          authorize IbProgrammeSetting
          render json: ::Ib::Governance::ProgrammeSettingsResolver.new(
            tenant: Current.tenant,
            school: current_school_scope
          ).resolve
        end

        def create
          authorize IbProgrammeSetting
          setting = IbProgrammeSetting.find_or_initialize_by(
            tenant: Current.tenant,
            school_id: selected_school_id,
            programme: programme_setting_params.fetch(:programme)
          )
          setting.assign_attributes(programme_setting_params.merge(updated_by: Current.user))
          setting.save!
          render json: setting, status: :created
        end

        alias update create

        private

        def programme_setting_params
          params.require(:ib_programme_setting).permit(:school_id, :programme, :cadence_mode, :review_owner_role, thresholds: {}, metadata: {})
        end

        def selected_school_id
          programme_setting_params[:school_id].presence || current_school_scope&.id
        end
      end
    end
  end
end
