require "rails_helper"

RSpec.describe "Serializer Sensitive Data Audit" do
  FORBIDDEN_ATTRIBUTE_PATTERNS = %w[
    password
    secret
    token
    api_key
    access_token
    refresh_token
    private_key
  ].freeze

  SERIALIZER_DIR = Rails.root.join("app/serializers")

  Dir.glob(SERIALIZER_DIR.join("*.rb")).each do |file|
    serializer_name = File.basename(file, ".rb").camelize

    describe serializer_name do
      it "does not directly expose sensitive attributes" do
        content = File.read(file)

        attribute_line = content.scan(/attributes\s+(.+)$/i).flatten.join(", ")
        attributes = attribute_line.scan(/:\w+/).map { |a| a.delete(":") }

        sensitive = attributes.select do |attr|
          FORBIDDEN_ATTRIBUTE_PATTERNS.any? { |pattern| attr.include?(pattern) }
        end

        expect(sensitive).to be_empty,
          "#{serializer_name} exposes sensitive attributes: #{sensitive.join(', ')}. " \
          "Use redacted helper methods instead."
      end

      it "does not expose raw 'settings' JSONB without redaction" do
        content = File.read(file)

        if content.match?(/attributes\s+.*:settings[,\s\n]/) && !content.include?("def settings")
          model_name = serializer_name.sub("Serializer", "")
          sensitive_models = %w[IntegrationConfig AiProviderConfig LtiRegistration]

          if sensitive_models.include?(model_name)
            fail "#{serializer_name} exposes raw :settings for #{model_name}, which may contain credentials. Use a redacted method."
          end
        end
      end
    end
  end
end
