module Paginatable
  DEFAULT_PER_PAGE = 50
  MAX_PER_PAGE = 200

  private

  def paginate(relation)
    return relation unless pagination_requested?

    page = [params.fetch(:page, 1).to_i, 1].max
    per_page = params.fetch(:per_page, DEFAULT_PER_PAGE).to_i
    per_page = DEFAULT_PER_PAGE if per_page <= 0
    per_page = [per_page, MAX_PER_PAGE].min

    relation.offset((page - 1) * per_page).limit(per_page)
  end

  def pagination_requested?
    params[:page].present? || params[:per_page].present?
  end
end
