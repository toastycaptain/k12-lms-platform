# frozen_string_literal: true

class IbDocumentCollaboratorPolicy < IbSchoolScopedPolicy
  def show?
    CurriculumDocumentPolicy.new(user, curriculum_document).show?
  end

  def create?
    CurriculumDocumentPolicy.new(user, curriculum_document).update?
  end

  def update?
    create?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      document_scope = CurriculumDocumentPolicy::Scope.new(user, CurriculumDocument).resolve
      scope.joins(:curriculum_document).where(curriculum_documents: { id: document_scope.select(:id) })
    end
  end

  private

  def curriculum_document
    record.is_a?(IbDocumentCollaborator) ? record.curriculum_document : record
  end
end
