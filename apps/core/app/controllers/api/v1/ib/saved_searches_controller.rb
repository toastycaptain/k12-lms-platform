module Api
  module V1
    module Ib
      class SavedSearchesController < BaseController
        before_action :set_saved_search, only: [ :show, :update, :destroy ]

        def index
          authorize IbSavedSearch
          searches = policy_scope(IbSavedSearch).recent_first
          searches = searches.where(scope_key: params[:scope_key]) if params[:scope_key].present?
          render json: searches.map { |search| serialize_search(search) }
        end

        def show
          authorize @saved_search
          render json: serialize_search(@saved_search)
        end

        def create
          authorize IbSavedSearch
          search = policy_scope(IbSavedSearch).find_or_initialize_by(
            tenant: Current.tenant,
            school: current_school_scope,
            user: Current.user,
            name: saved_search_params.fetch(:name),
            scope_key: saved_search_params[:scope_key].presence || "ib"
          )
          search.assign_attributes(
            query: saved_search_params[:query],
            lens_key: saved_search_params[:lens_key].presence || "custom",
            filters: saved_search_params[:filters] || {},
            metadata: saved_search_params[:metadata] || {},
            last_run_at: Time.current
          )
          search.save!
          render json: serialize_search(search), status: :created
        end

        def update
          authorize @saved_search
          @saved_search.update!(
            name: saved_search_params[:name].presence || @saved_search.name,
            query: saved_search_params[:query].presence || @saved_search.query,
            lens_key: saved_search_params[:lens_key].presence || @saved_search.lens_key,
            filters: @saved_search.filters.merge((saved_search_params[:filters] || {}).to_h.deep_stringify_keys),
            metadata: @saved_search.metadata.merge((saved_search_params[:metadata] || {}).to_h.deep_stringify_keys),
            last_run_at: Time.current
          )
          render json: serialize_search(@saved_search)
        end

        def destroy
          authorize @saved_search
          @saved_search.destroy!
          head :no_content
        end

        private

        def set_saved_search
          @saved_search = policy_scope(IbSavedSearch).find(params[:id])
        end

        def saved_search_params
          params.fetch(:ib_saved_search, params).permit(:name, :query, :lens_key, :scope_key, filters: {}, metadata: {})
        end

        def serialize_search(search)
          {
            id: search.id,
            name: search.name,
            query: search.query,
            lens_key: search.lens_key,
            scope_key: search.scope_key,
            share_token: search.share_token,
            filters: search.filters,
            metadata: search.metadata,
            last_run_at: search.last_run_at&.utc&.iso8601,
            updated_at: search.updated_at.utc.iso8601
          }
        end
      end
    end
  end
end
