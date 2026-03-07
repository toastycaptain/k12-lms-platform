module Ib
  module Operations
    class ExportService
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build_shareable_summary(persist: false)
        mart = DataMartBuilder.new(tenant: user.tenant, school: school).build
        share_token = SecureRandom.hex(10)
        if persist
          IbUserWorkspacePreference.write_value!(
            user: user,
            school: school,
            surface: "operations_center",
            context_key: "exports",
            preference_key: "share_view",
            value: { "share_token" => share_token, "snapshot" => mart, "expires_at" => 7.days.from_now.utc.iso8601 },
            metadata: { "generated_for" => "leadership_summary" }
          )
        end
        {
          share_token: share_token,
          expires_at: 7.days.from_now.utc.iso8601,
          snapshot: mart
        }
      end

      private

      attr_reader :user, :school
    end
  end
end
