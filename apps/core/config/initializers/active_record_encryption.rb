# Active Record Encryption configuration
#
# In production, real encryption keys MUST be set via environment variables.
# In development/test, fallback keys are used automatically.
#
# Generate keys with: rails production:generate_encryption_keys

ENCRYPTION_KEYS = %w[
  ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY
  ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY
  ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT
].freeze

if Rails.env.production?
  missing = ENCRYPTION_KEYS.select { |key| ENV[key].blank? }

  if missing.any?
    Rails.logger.warn(
      "WARNING: Missing Active Record Encryption keys: #{missing.join(', ')}. " \
      "Encrypted columns will not work correctly. " \
      "Generate keys with: rails production:generate_encryption_keys",
    )
  end
end

Rails.application.configure do
  if Rails.env.production?
    config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"].presence
    config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"].presence
    config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"].presence
  else
    # Development/test fallback keys — NOT suitable for production
    config.active_record.encryption.primary_key = ENV.fetch(
      "ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY",
      "test-primary-key-that-is-long-enough",
    )
    config.active_record.encryption.deterministic_key = ENV.fetch(
      "ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY",
      "test-deterministic-key-long-enough",
    )
    config.active_record.encryption.key_derivation_salt = ENV.fetch(
      "ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT",
      "test-key-derivation-salt-long-en",
    )
  end
end
