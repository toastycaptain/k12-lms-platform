module Ib
  module Guardian
    class DigestStrategyService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        settings = NotificationPreference.for_user(user)
        communication = IbCommunicationPreference.find_or_create_by!(
          tenant: user.tenant,
          school: school,
          user: user,
          audience: "guardian"
        )
        urgent_items = IbOperationalRecord.where(tenant_id: user.tenant_id, risk_level: "risk")
        urgent_items = urgent_items.where(school_id: school.id) if school
        {
          cadence_options: [ "immediate", "weekly_digest", "fortnightly", "monthly" ],
          current_preferences: {
            story_published: settings["ib_story_published"],
            readiness_blocker: settings["ib_readiness_blocker"]
          },
          communication_preferences: {
            locale: communication.locale,
            digest_cadence: communication.digest_cadence,
            quiet_hours_start: communication.quiet_hours_start,
            quiet_hours_end: communication.quiet_hours_end,
            quiet_hours_timezone: communication.quiet_hours_timezone
          },
          urgent_count: urgent_items.count,
          routine_story_count: IbLearningStory.where(tenant_id: user.tenant_id, state: "published").yield_self { |scope| school ? scope.where(school_id: school.id) : scope }.count
        }
      end

      private

      attr_reader :user, :school
    end
  end
end
