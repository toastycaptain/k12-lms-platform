require "rails_helper"

RSpec.describe AttachmentValidatable, type: :model do
  let!(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "content type validation" do
    it "allows PDF attachments on submissions" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, user: student, tenant: tenant)
      submission.attachment.attach(
        io: StringIO.new("fake pdf"),
        filename: "homework.pdf",
        content_type: "application/pdf"
      )

      expect(submission).to be_valid
    end

    it "rejects executable files" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, user: student, tenant: tenant)
      submission.attachment.attach(
        io: StringIO.new("malicious content"),
        filename: "malware.exe",
        content_type: "application/x-msdownload"
      )

      expect(submission).not_to be_valid
      expect(submission.errors[:attachment].first).to include("unsupported file type")
    end

    it "rejects files exceeding size limit" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, user: student, tenant: tenant)

      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new("x"),
        filename: "large.pdf",
        content_type: "application/pdf"
      )
      allow(blob).to receive(:byte_size).and_return(60.megabytes)
      submission.attachment.attach(blob)

      expect(submission).not_to be_valid
      expect(submission.errors[:attachment].first).to include("too large")
    end

    it "rejects dangerous file extensions" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      submission = build(:submission, assignment: assignment, user: student, tenant: tenant)

      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new("#!/bin/bash\nrm -rf /"),
        filename: "script.sh",
        content_type: "text/plain",
        identify: false
      )
      submission.attachment.attach(blob)

      expect(submission).not_to be_valid
      expect(submission.errors[:attachment].first).to include("dangerous file extension")
    end

    it "allows common document types" do
      course = create(:course, tenant: tenant)
      assignment = create(:assignment, course: course, tenant: tenant, created_by: create(:user, tenant: tenant))
      student = create(:user, tenant: tenant)

      %w[application/pdf image/jpeg image/png text/plain text/csv].each do |content_type|
        submission = build(:submission, assignment: assignment, user: student, tenant: tenant)
        ext = { "application/pdf" => "pdf", "image/jpeg" => "jpg", "image/png" => "png", "text/plain" => "txt", "text/csv" => "csv" }[content_type]
        submission.attachment.attach(
          io: StringIO.new("content"),
          filename: "file.#{ext}",
          content_type: content_type
        )
        expect(submission).to be_valid, "Expected #{content_type} to be allowed but it was rejected"
      end
    end
  end
end
