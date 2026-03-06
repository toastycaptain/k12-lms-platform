# frozen_string_literal: true

class CurriculumDocumentLinkPolicy < ApplicationPolicy
  def index?
    CurriculumDocumentPolicy.new(user, source_document).show?
  end

  def create?
    CurriculumDocumentPolicy.new(user, source_document).update?
  end

  def destroy?
    CurriculumDocumentPolicy.new(user, source_document).update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      document_scope = CurriculumDocumentPolicy::Scope.new(user, CurriculumDocument).resolve
      scope.where(source_document_id: document_scope.select(:id))
    end
  end

  private

  def source_document
    if record.is_a?(CurriculumDocumentLink)
      record.source_document
    else
      record
    end
  end
end
