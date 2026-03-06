# frozen_string_literal: true

class IbDocumentCommentPolicy < IbSchoolScopedPolicy
  def show?
    CurriculumDocumentPolicy.new(user, curriculum_document).show?
  end

  def create?
    CurriculumDocumentPolicy.new(user, curriculum_document).show?
  end

  def update?
    privileged_user? || record.author_id == user.id || CurriculumDocumentPolicy.new(user, curriculum_document).update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      document_scope = CurriculumDocumentPolicy::Scope.new(user, CurriculumDocument).resolve
      scope.joins(:curriculum_document).where(curriculum_documents: { id: document_scope.select(:id) })
    end
  end

  private

  def curriculum_document
    record.is_a?(IbDocumentComment) ? record.curriculum_document : record
  end
end
