class OneRosterClient
  class OneRosterError < StandardError
    attr_reader :status_code, :response_body

    def initialize(message, status_code: nil, response_body: nil)
      super(message)
      @status_code = status_code
      @response_body = response_body
    end
  end

  CACHE_KEY_PREFIX = "one_roster_token"
  DEFAULT_LIMIT = 100

  def initialize(base_url:, client_id:, client_secret:)
    validate_url_safety!(base_url)
    @base_url = base_url.to_s.chomp("/")
    @client_id = client_id
    @client_secret = client_secret

    @conn = Faraday.new(url: @base_url) do |f|
      f.request :json
      f.response :json
      f.options.timeout = 60
      f.options.open_timeout = 30
      f.adapter Faraday.default_adapter
    end

    @token_conn = Faraday.new(url: @base_url) do |f|
      f.request :url_encoded
      f.response :json
      f.options.timeout = 30
      f.options.open_timeout = 30
      f.adapter Faraday.default_adapter
    end
  end

  def get_all_orgs(limit: DEFAULT_LIMIT, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/orgs", "orgs", limit: limit, offset: offset, filter: filter)
  end

  def get_all_users(limit: DEFAULT_LIMIT, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/users", "users", limit: limit, offset: offset, filter: filter)
  end

  def get_all_classes(limit: DEFAULT_LIMIT, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/classes", "classes", limit: limit, offset: offset, filter: filter)
  end

  def get_all_enrollments(limit: DEFAULT_LIMIT, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/enrollments", "enrollments", limit: limit, offset: offset, filter: filter)
  end

  def get_all_academic_sessions(limit: DEFAULT_LIMIT, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/academicSessions", "academicSessions", limit: limit, offset: offset, filter: filter)
  end

  private

  def validate_url_safety!(url)
    uri = URI.parse(url)

    blocked_hosts = %w[localhost 127.0.0.1 0.0.0.0 ::1 169.254.169.254 metadata.google.internal]
    if blocked_hosts.include?(uri.host&.downcase)
      raise ArgumentError, "OneRoster base_url cannot point to internal addresses: #{uri.host}"
    end

    begin
      addr = IPAddr.new(uri.host)
      if addr.private? || addr.loopback? || addr.link_local?
        raise ArgumentError, "OneRoster base_url cannot point to private IP: #{uri.host}"
      end
    rescue IPAddr::InvalidAddressError
      # Hostname, not IP — fine
    end
  rescue URI::InvalidURIError
    raise ArgumentError, "OneRoster base_url is not a valid URL: #{url}"
  end

  def authenticate!
    response = @token_conn.post("/token") do |req|
      req.body = {
        grant_type: "client_credentials",
        client_id: @client_id,
        client_secret: @client_secret
      }
    end

    unless response.success?
      raise OneRosterError.new(
        "OneRoster authentication failed",
        status_code: response.status,
        response_body: response.body
      )
    end

    access_token = response.body.fetch("access_token")
    expires_in = response.body.fetch("expires_in", 3600).to_i
    Rails.cache.write(cache_key, access_token, expires_in: [ expires_in - 60, 60 ].max)
    access_token
  rescue KeyError => e
    raise OneRosterError.new("Invalid token response: #{e.message}")
  end

  def token
    Rails.cache.read(cache_key) || authenticate!
  end

  def cache_key
    "#{CACHE_KEY_PREFIX}/#{Digest::SHA256.hexdigest(@client_id.to_s)}"
  end

  def get_all_paginated(path, key, limit:, offset:, filter:)
    all_records = []
    current_offset = offset

    loop do
      params = { limit: limit, offset: current_offset }
      params[:filter] = filter if filter.present?
      response = authenticated_get(path, params)
      batch = response.body.fetch(key, [])
      all_records.concat(batch)

      break if batch.length < limit

      next_link = extract_next_link(response.headers)
      if next_link.present?
        uri = URI.parse(next_link)
        query = Rack::Utils.parse_nested_query(uri.query)
        current_offset = query["offset"].to_i
      else
        current_offset += limit
      end
    end

    all_records
  end

  def authenticated_get(path, params, retry_auth: true)
    response = @conn.get(path) do |req|
      req.headers["Authorization"] = "Bearer #{token}"
      req.params = params
    end

    if response.status == 401 && retry_auth
      authenticate!
      return authenticated_get(path, params, retry_auth: false)
    end

    unless response.success?
      raise OneRosterError.new(
        "OneRoster API request failed",
        status_code: response.status,
        response_body: response.body
      )
    end

    response
  end

  def extract_next_link(headers)
    raw_link = headers["Link"] || headers["link"]
    return nil if raw_link.blank?

    raw_link.to_s.split(",").map(&:strip).each do |segment|
      next unless segment.include?('rel="next"')

      match = segment.match(/<([^>]+)>/)
      return match[1] if match
    end

    nil
  end
end
