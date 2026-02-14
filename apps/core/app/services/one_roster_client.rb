class OneRosterClient
  CACHE_KEY_PREFIX = "one_roster_token"

  attr_reader :base_url

  def initialize(base_url:, client_id:, client_secret:)
    @base_url = base_url.chomp("/")
    @client_id = client_id
    @client_secret = client_secret
    @conn = build_connection
  end

  def authenticate!
    response = token_connection.post("/token") do |req|
      req.body = {
        grant_type: "client_credentials",
        client_id: @client_id,
        client_secret: @client_secret
      }
    end

    unless response.success?
      raise OneRosterError.new(
        "Authentication failed: #{response.status}",
        status_code: response.status,
        response_body: response.body
      )
    end

    body = response.body
    token = body["access_token"]
    expires_in = body.fetch("expires_in", 3600).to_i

    cache_key = "#{CACHE_KEY_PREFIX}/#{@client_id}"
    Rails.cache.write(cache_key, token, expires_in: expires_in - 60)

    token
  end

  def get_all_orgs(limit: 100, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/orgs", "orgs", limit: limit, offset: offset, filter: filter)
  end

  def get_all_users(limit: 100, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/users", "users", limit: limit, offset: offset, filter: filter)
  end

  def get_all_classes(limit: 100, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/classes", "classes", limit: limit, offset: offset, filter: filter)
  end

  def get_all_enrollments(limit: 100, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/enrollments", "enrollments", limit: limit, offset: offset, filter: filter)
  end

  def get_all_academic_sessions(limit: 100, offset: 0, filter: nil)
    get_all_paginated("/ims/oneroster/v1p1/academicSessions", "academicSessions", limit: limit, offset: offset, filter: filter)
  end

  private

  def build_connection
    Faraday.new(url: @base_url) do |f|
      f.request :json
      f.response :json
      f.options.timeout = 60
      f.options.open_timeout = 30
    end
  end

  def token_connection
    Faraday.new(url: @base_url) do |f|
      f.request :url_encoded
      f.response :json
      f.options.timeout = 30
      f.options.open_timeout = 30
    end
  end

  def access_token
    cache_key = "#{CACHE_KEY_PREFIX}/#{@client_id}"
    Rails.cache.read(cache_key) || authenticate!
  end

  def get_all_paginated(path, data_key, limit:, offset:, filter:)
    all_records = []
    current_offset = offset

    loop do
      params = { limit: limit, offset: current_offset }
      params[:filter] = filter if filter.present?

      response = authenticated_get(path, params)
      records = response.body.fetch(data_key, [])
      all_records.concat(records)

      next_url = extract_next_link(response)
      break unless next_url

      uri = URI.parse(next_url)
      query = URI.decode_www_form(uri.query || "").to_h
      current_offset = query["offset"]&.to_i || (current_offset + limit)
    end

    all_records
  end

  def authenticated_get(path, params, retry_auth: true)
    token = access_token

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
        "OneRoster API error: #{response.status}",
        status_code: response.status,
        response_body: response.body
      )
    end

    response
  end

  def extract_next_link(response)
    link_header = response.headers["Link"] || response.headers["link"]
    return nil unless link_header

    links = link_header.split(",").map(&:strip)
    next_link = links.find { |l| l.include?('rel="next"') }
    return nil unless next_link

    match = next_link.match(/<([^>]+)>/)
    match ? match[1] : nil
  end
end
