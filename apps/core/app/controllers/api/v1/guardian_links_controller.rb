module Api
  module V1
    class GuardianLinksController < ApplicationController
      before_action :set_guardian_link, only: [ :destroy ]

      def index
        authorize GuardianLink

        guardian_links = policy_scope(GuardianLink)
        guardian_links = guardian_links.where(student_id: params[:student_id]) if params[:student_id].present?
        guardian_links = paginate(guardian_links)

        render json: guardian_links
      end

      def create
        guardian_link = GuardianLink.new(guardian_link_params)
        guardian_link.tenant = Current.tenant
        authorize guardian_link

        if guardian_link.save
          render json: guardian_link, status: :created
        else
          render json: { errors: guardian_link.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @guardian_link
        @guardian_link.destroy!

        head :no_content
      end

      private

      def set_guardian_link
        @guardian_link = GuardianLink.find(params[:id])
      end

      def guardian_link_params
        params.permit(:guardian_id, :student_id, :relationship, :status)
      end
    end
  end
end
