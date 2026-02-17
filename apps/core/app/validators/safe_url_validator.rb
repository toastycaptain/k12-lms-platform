require "ipaddr"

class SafeUrlValidator < ActiveModel::EachValidator
  BLOCKED_HOSTS = %w[
    localhost
    127.0.0.1
    0.0.0.0
    ::1
    [::1]
    metadata.google.internal
    169.254.169.254
    metadata.internal
  ].freeze

  BLOCKED_RANGES = [
    IPAddr.new("10.0.0.0/8"),
    IPAddr.new("172.16.0.0/12"),
    IPAddr.new("192.168.0.0/16"),
    IPAddr.new("127.0.0.0/8"),
    IPAddr.new("169.254.0.0/16"),
    IPAddr.new("0.0.0.0/8"),
    IPAddr.new("::1/128"),
    IPAddr.new("fc00::/7"),
    IPAddr.new("fe80::/10")
  ].freeze

  def validate_each(record, attribute, value)
    return if value.blank?

    begin
      uri = URI.parse(value.to_s.strip)
    rescue URI::InvalidURIError
      record.errors.add(attribute, "is not a valid URL")
      return
    end

    unless %w[http https].include?(uri.scheme)
      record.errors.add(attribute, "must use http or https (got: #{uri.scheme})")
      return
    end

    if uri.host.blank?
      record.errors.add(attribute, "must include a hostname")
      return
    end

    host = uri.host.downcase.gsub(/[\[\]]/, "")

    if BLOCKED_HOSTS.include?(host)
      record.errors.add(attribute, "cannot point to internal addresses (#{host})")
      return
    end

    begin
      addr = IPAddr.new(host)
      if BLOCKED_RANGES.any? { |range| range.include?(addr) }
        record.errors.add(attribute, "cannot point to private or internal IP addresses")
        nil
      end
    rescue IPAddr::InvalidAddressError
      if host.match?(/\A\d+\.\d+\.\d+\.\d+\z/)
        record.errors.add(attribute, "contains an invalid IP address")
        nil
      end
    end
  end
end
