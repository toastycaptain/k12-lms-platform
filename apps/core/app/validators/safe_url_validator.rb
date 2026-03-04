class SafeUrlValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.blank?

    OutboundUrlGuard.validate!(
      value,
      allowed_schemes: options[:allowed_schemes],
      allowed_ports: options[:allowed_ports],
      allowed_host_patterns: options[:allowed_domains],
      allowed_path_prefixes: options[:allowed_path_prefixes],
      require_dns_resolution: options.fetch(:require_dns_resolution, Rails.env.production?)
    )
  rescue OutboundUrlGuard::ValidationError => e
    record.errors.add(attribute, e.message)
  end
end
