# frozen_string_literal: true

class CurriculumDocumentVersionPolicy < ApplicationPolicy
  def index?
    CurriculumDocumentPolicy.new(user, curriculum_document).show?
  end

  def show?
    index?
  end

  def create?
    CurriculumDocumentPolicy.new(user, curriculum_document).update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      document_scope = CurriculumDocumentPolicy::Scope.new(user, CurriculumDocument).resolve
      scope.where(curriculum_document_id: document_scope.select(:id))
    end
  end

  private

  def curriculum_document
    if record.is_a?(CurriculumDocumentVersion)
      record.curriculum_document
    else
      record
    end
  end
end
