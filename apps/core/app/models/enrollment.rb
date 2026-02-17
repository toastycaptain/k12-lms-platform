class Enrollment < ApplicationRecord
  include TenantScoped

  VALID_ROLES = %w[teacher student].freeze

  belongs_to :user
  belongs_to :section

  validates :role, presence: true, inclusion: { in: VALID_ROLES }
  validates :user_id, uniqueness: { scope: :section_id, message: "already enrolled in this section" }

  after_commit :sync_course_enrollments_count, on: %i[create update destroy]

  private

  def sync_course_enrollments_count
    section_ids = [ section_id, section_id_before_last_save, *Array(saved_change_to_section_id) ].compact.uniq
    return if section_ids.empty?

    course_ids = Section.where(id: section_ids).distinct.pluck(:course_id).compact
    course_ids.each do |course_id|
      count = Enrollment.joins(:section).where(sections: { course_id: course_id }).count
      Course.where(id: course_id).update_all(enrollments_count: count) # rubocop:disable Rails/SkipsModelValidations
    end
  end
end
