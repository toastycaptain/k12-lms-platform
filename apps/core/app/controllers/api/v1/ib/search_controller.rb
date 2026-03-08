module Api
  module V1
    module Ib
      class SearchController < BaseController
        def index
          authorize :search, :index?
          skip_policy_scope
          payload = ::Ib::Search::UnifiedSearchService.new(
            user: Current.user,
            school: current_school_scope,
            tenant: Current.tenant
          ).search_payload(
            query: params[:q],
            limit: params[:limit] || 10,
            kind: params[:kind],
            programme: params[:programme],
            filters: search_filters
          )
          render json: payload
        end

        private

        def search_filters
          raw = params[:filters]
          return {} unless raw.respond_to?(:to_unsafe_h) || raw.is_a?(Hash)

          raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
        end
      end
    end
  end
end
