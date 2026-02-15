# frozen_string_literal: true

class SearchPolicy < ApplicationPolicy
  def index?
    true
  end
end
