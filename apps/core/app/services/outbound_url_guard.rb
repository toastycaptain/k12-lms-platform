require "ipaddr"
require "resolv"
require "uri"

class OutboundUrlGuard
  class ValidationError < StandardError; end

  BLOCKED_HOSTS = %w[
    localhost
    metadata.google.internal
    metadata.internal
    metadata
  ].freeze

  BLOCKED_RANGES = [
    IPAddr.new("0.0.0.0/8"),
    IPAddr.new("10.0.0.0/8"),
    IPAddr.new("100.64.0.0/10"),
    IPAddr.new("127.0.0.0/8"),
    IPAddr.new("169.254.0.0/16"),
    IPAddr.new("172.16.0.0/12"),
    IPAddr.new("192.0.0.0/24"),
    IPAddr.new("192.0.2.0/24"),
    IPAddr.new("192.168.0.0/16"),
    IPAddr.new("198.18.0.0/15"),
    IPAddr.new("198.51.100.0/24"),
    IPAddr.new("203.0.113.0/24"),
    IPAddr.new("224.0.0.0/4"),
    IPAddr.new("240.0.0.0/4"),
    IPAddr.new("::/128"),
    IPAddr.new("::1/128"),
    IPAddr.new("fc00::/7"),
    IPAddr.new("fe80::/10"),
    IPAddr.new("ff00::/8")
  ].freeze

  DEFAULT_HTTP_SCHEMES = %w[http https].freeze
  DEFAULT_HTTPS_SCHEMES = %w[https].freeze

  class << self
    def default_allowed_schemes
      Rails.env.production? ? DEFAULT_HTTPS_SCHEMES : DEFAULT_HTTP_SCHEMES
    end

    def validate!(
      url,
      allowed_schemes: nil,
      allowed_ports: nil,
      allowed_host_patterns: nil,
      allowed_path_prefixes: nil,
      require_dns_resolution: true
    )
      new(
        url: url,
        allowed_schemes: Array(allowed_schemes.presence || default_allowed_schemes),
        allowed_ports: normalize_ports(allowed_ports),
        allowed_host_patterns: Array(allowed_host_patterns).compact,
        allowed_path_prefixes: Array(allowed_path_prefixes).compact,
        require_dns_resolution: require_dns_resolution
      ).validate!
    end

    private

    def normalize_ports(ports)
      Array(ports).filter_map do |port|
        Integer(port)
      rescue ArgumentError, TypeError
        nil
      end
    end
  end

  def initialize(
    url:,
    allowed_schemes:,
    allowed_ports:,
    allowed_host_patterns:,
    allowed_path_prefixes:,
    require_dns_resolution:
  )
    @url = url.to_s.strip
    @allowed_schemes = allowed_schemes.map(&:to_s).map(&:downcase)
    @allowed_ports = allowed_ports
    @allowed_host_patterns = allowed_host_patterns
    @allowed_path_prefixes = allowed_path_prefixes
    @require_dns_resolution = require_dns_resolution
  end

  def validate!
    uri = parse_uri!
    validate_scheme!(uri)
    validate_credentials!(uri)

    host = normalized_host(uri.host)
    raise ValidationError, "must include a hostname" if host.blank?

    validate_host!(host)
    validate_host_allowlist!(host)
    validate_port!(uri)
    validate_path!(uri)

    resolved_ips = resolve_ips(host)
    validate_ip_addresses!(resolved_ips)

    uri
  end

  private

  attr_reader :url, :allowed_schemes, :allowed_ports, :allowed_host_patterns, :allowed_path_prefixes, :require_dns_resolution

  def parse_uri!
    URI.parse(url)
  rescue URI::InvalidURIError
    raise ValidationError, "is not a valid URL"
  end

  def validate_scheme!(uri)
    scheme = uri.scheme.to_s.downcase
    if scheme.blank? || !allowed_schemes.include?(scheme)
      raise ValidationError, "must use one of: #{allowed_schemes.join(', ')}"
    end
  end

  def validate_credentials!(uri)
    return if uri.userinfo.blank?

    raise ValidationError, "must not contain embedded credentials"
  end

  def normalized_host(raw_host)
    raw_host.to_s.downcase.gsub(/\A\[|\]\z/, "").chomp(".")
  end

  def validate_host!(host)
    if BLOCKED_HOSTS.include?(host)
      raise ValidationError, "cannot point to internal address: #{host}"
    end

    if host.end_with?(".local", ".internal")
      raise ValidationError, "cannot point to local/internal hostnames"
    end
  end

  def validate_host_allowlist!(host)
    return if allowed_host_patterns.empty?

    return if allowed_host_patterns.any? { |pattern| host_matches_pattern?(host, pattern) }

    raise ValidationError, "hostname is not in the allowed host list"
  end

  def validate_port!(uri)
    return if allowed_ports.empty?

    port = uri.port || default_port_for_scheme(uri.scheme)
    return if port && allowed_ports.include?(port)

    raise ValidationError, "port #{port} is not allowed"
  end

  def validate_path!(uri)
    return if allowed_path_prefixes.empty?

    path = uri.path.presence || "/"
    return if allowed_path_prefixes.any? { |prefix| path.start_with?(prefix.to_s) }

    raise ValidationError, "path is not in the allowed path list"
  end

  def resolve_ips(host)
    return [ IPAddr.new(host) ] if ip_literal?(host)
    return [] unless require_dns_resolution

    addresses = Resolv.getaddresses(host)
    if addresses.empty?
      raise ValidationError, "hostname could not be resolved"
    end

    addresses.map { |address| IPAddr.new(address) }
  rescue Resolv::ResolvError, SocketError, IPAddr::InvalidAddressError
    raise ValidationError, "hostname could not be resolved"
  end

  def validate_ip_addresses!(ips)
    ips.each do |ip|
      raise ValidationError, "cannot resolve to private or internal IP addresses" if blocked_ip?(ip)
    end
  end

  def blocked_ip?(ip)
    return true if BLOCKED_RANGES.any? { |range| range.include?(ip) }
    return true if ip.respond_to?(:private?) && ip.private?
    return true if ip.respond_to?(:loopback?) && ip.loopback?
    return true if ip.respond_to?(:link_local?) && ip.link_local?
    return true if ip.respond_to?(:multicast?) && ip.multicast?
    return true if ip.respond_to?(:unspecified?) && ip.unspecified?

    false
  end

  def host_matches_pattern?(host, pattern)
    case pattern
    when Regexp
      pattern.match?(host)
    else
      string_pattern = pattern.to_s.strip.downcase
      return false if string_pattern.blank?

      if string_pattern.start_with?("*.")
        suffix = string_pattern.delete_prefix("*.")
        host == suffix || host.end_with?(".#{suffix}")
      elsif string_pattern.start_with?("/") && string_pattern.end_with?("/") && string_pattern.length > 2
        Regexp.new(string_pattern[1..-2]).match?(host)
      elsif string_pattern.include?("*")
        wildcard = Regexp.escape(string_pattern).gsub("\\*", ".*")
        Regexp.new("\\A#{wildcard}\\z").match?(host)
      else
        host == string_pattern
      end
    end
  end

  def ip_literal?(host)
    IPAddr.new(host)
    true
  rescue IPAddr::InvalidAddressError
    false
  end

  def default_port_for_scheme(scheme)
    case scheme.to_s.downcase
    when "https"
      443
    when "http"
      80
    end
  end
end
