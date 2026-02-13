# frozen_string_literal: true

class TemplateVersionPolicy < ApplicationPolicy
  def show?
    true
  end

  def update?
    user.has_role?(:admin) || user.has_role?(:curriculum_lead)
  end
end
