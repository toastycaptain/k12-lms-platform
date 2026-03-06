module AttachmentValidatable
  extend ActiveSupport::Concern

  ALLOWED_IMAGE_TYPES = %w[
    image/jpeg
    image/png
    image/gif
    image/webp
  ].freeze

  ALLOWED_DOCUMENT_TYPES = %w[
    application/pdf
    application/msword
    application/vnd.openxmlformats-officedocument.wordprocessingml.document
    application/vnd.ms-excel
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    application/vnd.ms-powerpoint
    application/vnd.openxmlformats-officedocument.presentationml.presentation
    text/plain
    text/csv
    text/html
    application/zip
    application/x-zip-compressed
  ].freeze

  ALLOWED_SUBMISSION_TYPES = (ALLOWED_IMAGE_TYPES + ALLOWED_DOCUMENT_TYPES).freeze

  ALLOWED_EXPORT_TYPES = %w[
    application/pdf
    application/xml
    text/xml
    application/zip
  ].freeze

  MAX_SUBMISSION_SIZE = 50.megabytes
  MAX_EXPORT_SIZE = 100.megabytes

  DANGEROUS_EXTENSIONS = %w[
    .exe .bat .cmd .com .msi .scr .pif .vbs .vbe .js .jse
    .ws .wsf .wsc .wsh .ps1 .ps1xml .ps2 .ps2xml .psc1 .psc2
    .msh .msh1 .msh2 .mshxml .msh1xml .msh2xml .inf .reg
    .rgs .sct .shb .shs .lnk .dll .so .dylib .sh .bash .php
    .jsp .asp .aspx .cgi .py .rb .pl
  ].freeze

  class_methods do
    def validates_attachment(attribute, content_types: ALLOWED_SUBMISSION_TYPES, max_size: MAX_SUBMISSION_SIZE, count: nil)
      validate :"validate_#{attribute}_attachment"

      define_method(:"validate_#{attribute}_attachment") do
        attachment = send(attribute)
        return unless attachment.attached?

        blobs = attachment.respond_to?(:attachments) ? attachment.attachments.map(&:blob) : [ attachment.blob ]

        if count
          max_count = count.is_a?(Hash) ? count[:max] : count
          min_count = count.is_a?(Hash) ? count[:min] : nil

          if max_count && blobs.length > max_count
            errors.add(attribute, "has too many files (#{blobs.length}). Maximum: #{max_count}")
          end

          if min_count && blobs.length < min_count
            errors.add(attribute, "must have at least #{min_count} file#{min_count == 1 ? '' : 's'}")
          end
        end

        blobs.each do |blob|
          unless content_types.include?(blob.content_type)
            errors.add(attribute, "has an unsupported file type (#{blob.content_type}). Allowed: #{content_types.join(', ')}")
          end

          if blob.byte_size > max_size
            errors.add(attribute, "is too large (#{(blob.byte_size / 1.megabyte.to_f).round(1)}MB). Maximum: #{(max_size / 1.megabyte.to_f).round(0)}MB")
          end

          filename = blob.filename.to_s.downcase
          extension = File.extname(filename)
          if DANGEROUS_EXTENSIONS.include?(extension)
            errors.add(attribute, "has a dangerous file extension (#{extension}). This file type is not allowed.")
          end
        end
      end
    end
  end
end
