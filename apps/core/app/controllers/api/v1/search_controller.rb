module Api
  module V1
    class SearchController < ApplicationController
      def index
        authorize :search, :index?
        skip_policy_scope

        query = params[:q].to_s.strip
        return render json: { results: [] } if query.length < 2

        types = params[:types].presence
        results = SearchService.new.search(
          query: query,
          user: Current.user,
          types: types,
          limit: params[:limit].presence || 10
        )

        render json: { results: results }
      end
    end
  end
end
