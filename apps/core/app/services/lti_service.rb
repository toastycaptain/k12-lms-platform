class LtiService
  def self.platform_keypair
    @platform_keypair ||= begin
      pem = Rails.application.credentials.dig(:lti, :private_key)
      if pem.present?
        OpenSSL::PKey::RSA.new(pem)
      elsif Rails.env.production?
        raise "LTI private key not configured"
      else
        OpenSSL::PKey::RSA.generate(2048)
      end
    end
  end
end
