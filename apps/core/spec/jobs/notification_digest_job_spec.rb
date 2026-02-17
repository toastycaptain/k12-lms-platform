require "rails_helper"

RSpec.describe NotificationDigestJob, type: :job do
  include ActiveJob::TestHelper

  let(:tenant) { create(:tenant) }
  let(:user) { create(:user, tenant: tenant) }

  before do
    clear_enqueued_jobs
    Current.tenant = tenant
  end

  after do
    clear_enqueued_jobs
    Current.tenant = nil
  end

  it "enqueues a digest email for users with matching digest preference and unread notifications" do
    create(
      :notification_preference,
      tenant: tenant,
      user: user,
      event_type: "assignment_created",
      email: true,
      email_frequency: "daily"
    )
    create(:notification, tenant: tenant, user: user, read_at: nil, created_at: 2.hours.ago)

    expect {
      described_class.perform_now("daily")
    }.to have_enqueued_mail(NotificationMailer, :daily_digest)
  end

  it "skips users with no unread notifications in the digest window" do
    create(
      :notification_preference,
      tenant: tenant,
      user: user,
      event_type: "assignment_created",
      email: true,
      email_frequency: "daily"
    )
    create(:notification, tenant: tenant, user: user, read_at: Time.current, created_at: 2.hours.ago)

    described_class.perform_now("daily")

    expect(enqueued_jobs).to be_empty
  end
end
