# frozen_string_literal: true

class CurriculumDocumentVersionAlignmentPolicy < ApplicationPolicy
  def index?
    CurriculumDocumentVersionPolicy.new(user, curriculum_document_version).show?
  end

  def create?
    CurriculumDocumentVersionPolicy.new(user, curriculum_document_version).create?
  end

  def bulk_destroy?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      version_scope = CurriculumDocumentVersionPolicy::Scope.new(user, CurriculumDocumentVersion).resolve
      scope.where(curriculum_document_version_id: version_scope.select(:id))
    end
  end

  private

  def curriculum_document_version
    if record.is_a?(CurriculumDocumentVersionAlignment)
      record.curriculum_document_version
    else
      record
    end
  end
end
