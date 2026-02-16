require "fileutils"

Rails.application.config.lti_private_key = if ENV["LTI_PRIVATE_KEY"].present?
  OpenSSL::PKey::RSA.new(ENV["LTI_PRIVATE_KEY"])
elsif Rails.env.test? || Rails.env.development?
  key_path = Rails.root.join("tmp", "lti_key.pem")

  if File.exist?(key_path)
    OpenSSL::PKey::RSA.new(File.read(key_path))
  else
    key = OpenSSL::PKey::RSA.generate(2048)
    FileUtils.mkdir_p(File.dirname(key_path))
    File.write(key_path, key.to_pem)
    key
  end
else
  raise "LTI_PRIVATE_KEY environment variable is required in production"
end
