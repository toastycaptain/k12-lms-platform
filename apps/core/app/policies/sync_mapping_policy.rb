class SyncMappingPolicy < ApplicationPolicy
  def index?
    privileged_user? || user.has_role?(:teacher)
  end

  def show?
    privileged_user? || (user.has_role?(:teacher) && record_visible_to_teacher?)
  end

  def destroy?
    privileged_user?
  end

  def sync_roster?
    privileged_user? || (user.has_role?(:teacher) && record_visible_to_teacher?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all if privileged_user?
      return teacher_scope if user.has_role?(:teacher)

      scope.none
    end

    private

    def teacher_scope
      scope.where(local_type: "Course", local_id: taught_course_ids)
        .or(scope.where(local_type: "Section", local_id: taught_section_ids))
        .or(scope.where(local_type: "Enrollment", local_id: enrolled_student_ids))
        .or(scope.where(local_type: "Assignment", local_id: assignment_ids))
        .or(scope.where(local_type: "Submission", local_id: submission_ids))
    end

    def taught_section_ids
      Enrollment.where(user_id: user.id, role: "teacher").select(:section_id)
    end

    def taught_course_ids
      Section.where(id: taught_section_ids).select(:course_id)
    end

    def enrolled_student_ids
      Enrollment.where(section_id: taught_section_ids).select(:id)
    end

    def assignment_ids
      Assignment.where(course_id: taught_course_ids).select(:id)
    end

    def submission_ids
      Submission.joins(:assignment).where(assignments: { course_id: taught_course_ids }).select(:id)
    end
  end

  private

  def record_visible_to_teacher?
    case record.local_type
    when "Course"
      taught_course_ids.include?(record.local_id)
    when "Section"
      taught_section_ids.include?(record.local_id)
    when "Enrollment"
      Enrollment.exists?(id: record.local_id, section_id: taught_section_ids)
    when "Assignment"
      Assignment.exists?(id: record.local_id, course_id: taught_course_ids)
    when "Submission"
      Submission.joins(:assignment).exists?(
        submissions: { id: record.local_id },
        assignments: { course_id: taught_course_ids }
      )
    else
      false
    end
  end

  def taught_section_ids
    @taught_section_ids ||= Enrollment.where(user_id: user.id, role: "teacher").pluck(:section_id)
  end

  def taught_course_ids
    @taught_course_ids ||= Section.where(id: taught_section_ids).pluck(:course_id)
  end
end
