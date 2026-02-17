module WorkflowHelper
  def setup_tenant_and_users
    @tenant = create(:tenant)

    with_tenant do
      @admin = create(:user, tenant: @tenant)
      @admin.add_role(:admin)

      @teacher = create(:user, tenant: @tenant)
      @teacher.add_role(:teacher)

      @student = create(:user, tenant: @tenant)
      @student.add_role(:student)
    end
  end

  def cleanup_current_context
    Current.tenant = nil
    Current.user = nil
  end

  def with_tenant
    previous_tenant = Current.tenant
    Current.tenant = @tenant
    yield
  ensure
    Current.tenant = previous_tenant
  end

  def authenticate_as(user)
    mock_session(user, tenant: @tenant)
  end

  def api_get(path, user:, params: nil, status: :ok)
    authenticate_as(user)
    get(api_path(path), params: params)
    expect(response).to have_http_status(status)
    response.parsed_body
  end

  def api_post(path, user:, params: nil, status: :ok)
    authenticate_as(user)
    post(api_path(path), params: params)
    expect(response).to have_http_status(status)
    response.parsed_body
  end

  def api_patch(path, user:, params: nil, status: :ok)
    authenticate_as(user)
    patch(api_path(path), params: params)
    expect(response).to have_http_status(status)
    response.parsed_body
  end

  private

  def api_path(path)
    return path if path.start_with?("/")

    "/api/v1/#{path}"
  end
end
