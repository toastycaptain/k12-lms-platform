module Ib
  module Reporting
    class ReportDeliveryJob < ApplicationJob
      queue_as :ib_exports
      retry_on StandardError, wait: 30.seconds, attempts: 3

      def perform(report_id, actor_id, recipient_id = nil, channel = "pdf", locale = "en", audience_role = "guardian")
        report = IbReport.find(report_id)
        actor = User.find(actor_id)
        recipient = User.find_by(id: recipient_id)
        ReportService.new(user: actor, school: report.school).send(
          :deliver!,
          report,
          recipient: recipient,
          channel: channel,
          locale: locale,
          audience_role: audience_role
        )
      end
    end
  end
end
