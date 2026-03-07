module Api
  module V1
    module Ib
      class SearchController < BaseController
        def index
          authorize :search, :index?
          skip_policy_scope
          results = ::Ib::Search::UnifiedSearchService.new(user: Current.user, school: current_school_scope).search(
            query: params[:q],
            limit: params[:limit] || 10
          )
          render json: { results: results }
        end
      end
    end
  end
end
