class BackfillCurriculumProfileDefaults < ActiveRecord::Migration[8.0]
  DEFAULT_PROFILE_KEY = "american_common_core_v1".freeze

  disable_ddl_transaction!

  def up
    say_with_time "Setting missing tenant curriculum defaults" do
      Tenant.unscoped.where("settings->>'curriculum_default_profile_key' IS NULL").find_each(batch_size: 100) do |tenant|
        settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
        settings["curriculum_default_profile_key"] = DEFAULT_PROFILE_KEY
        tenant.update_columns(settings: settings, updated_at: Time.current)
      end
    end

    say_with_time "Backfilling courses.school_id for single-school tenants" do
      Tenant.unscoped.includes(:schools).find_each(batch_size: 100) do |tenant|
        schools = tenant.schools.to_a
        next unless schools.size == 1

        Course.unscoped.where(tenant_id: tenant.id, school_id: nil).update_all(school_id: schools.first.id)
      end
    end

    say_with_time "Reporting unresolved courses for multi-school tenants" do
      Tenant.unscoped.includes(:schools).find_each(batch_size: 100) do |tenant|
        next unless tenant.schools.size > 1

        unresolved_count = Course.unscoped.where(tenant_id: tenant.id, school_id: nil).count
        next if unresolved_count.zero?

        Rails.logger.warn(
          "[BackfillCurriculumProfileDefaults] tenant_id=#{tenant.id} unresolved_course_school_ids=#{unresolved_count}"
        )
      end
    end
  end

  def down
    say_with_time "Removing tenant curriculum defaults" do
      Tenant.unscoped.find_each(batch_size: 100) do |tenant|
        settings = tenant.settings.is_a?(Hash) ? tenant.settings.deep_dup : {}
        next unless settings.key?("curriculum_default_profile_key")

        settings.delete("curriculum_default_profile_key")
        tenant.update_columns(settings: settings, updated_at: Time.current)
      end
    end

    say "Preserving courses.school_id values on rollback to avoid destructive data loss"
  end
end
