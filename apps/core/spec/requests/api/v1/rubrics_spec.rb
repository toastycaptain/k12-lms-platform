require "rails_helper"

RSpec.describe "Api::V1::Rubrics", type: :request do
  let!(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:student) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:student)
    Current.tenant = nil
    u
  end

  after { Current.tenant = nil }

  describe "GET /api/v1/rubrics" do
    it "lists rubrics" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      create(:rubric, tenant: tenant, created_by: teacher)
      Current.tenant = nil

      get "/api/v1/rubrics"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end
  end

  describe "POST /api/v1/rubrics" do
    it "creates a rubric" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/rubrics", params: { title: "Essay Rubric", description: "Grading essays", points_possible: 100 }
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["title"]).to eq("Essay Rubric")
    end

    it "returns 403 for students" do
      mock_session(student, tenant: tenant)

      post "/api/v1/rubrics", params: { title: "Rubric" }
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/rubrics/:id" do
    it "shows rubric with nested criteria and ratings" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      rubric = create(:rubric, tenant: tenant, created_by: teacher)
      criterion = create(:rubric_criterion, tenant: tenant, rubric: rubric, title: "Content")
      create(:rubric_rating, tenant: tenant, rubric_criterion: criterion, description: "Excellent", points: 25)
      Current.tenant = nil

      get "/api/v1/rubrics/#{rubric.id}"
      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["rubric_criteria"].length).to eq(1)
      criterion_data = body["rubric_criteria"].first
      expect(criterion_data["title"]).to eq("Content")
      expect(criterion_data["rubric_ratings"]).to be_present
      expect(criterion_data["rubric_ratings"].length).to eq(1)
    end
  end

  describe "PATCH /api/v1/rubrics/:id" do
    it "updates a rubric" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      rubric = create(:rubric, tenant: tenant, created_by: teacher)
      Current.tenant = nil

      patch "/api/v1/rubrics/#{rubric.id}", params: { title: "Updated Rubric" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated Rubric")
    end
  end

  describe "DELETE /api/v1/rubrics/:id" do
    it "deletes a rubric" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      rubric = create(:rubric, tenant: tenant, created_by: teacher)
      Current.tenant = nil

      delete "/api/v1/rubrics/#{rubric.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "criteria API" do
    let(:rubric) do
      Current.tenant = tenant
      r = create(:rubric, tenant: tenant, created_by: teacher)
      Current.tenant = nil
      r
    end

    it "creates and lists criteria" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/rubrics/#{rubric.id}/criteria", params: { title: "Content", points: 25 }
      expect(response).to have_http_status(:created)

      get "/api/v1/rubrics/#{rubric.id}/criteria"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "updates a criterion" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      criterion = create(:rubric_criterion, tenant: tenant, rubric: rubric)
      Current.tenant = nil

      patch "/api/v1/rubric_criteria/#{criterion.id}", params: { title: "Updated" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["title"]).to eq("Updated")
    end

    it "deletes a criterion" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      criterion = create(:rubric_criterion, tenant: tenant, rubric: rubric)
      Current.tenant = nil

      delete "/api/v1/rubric_criteria/#{criterion.id}"
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "ratings API" do
    let(:rubric) do
      Current.tenant = tenant
      r = create(:rubric, tenant: tenant, created_by: teacher)
      Current.tenant = nil
      r
    end
    let(:criterion) do
      Current.tenant = tenant
      c = create(:rubric_criterion, tenant: tenant, rubric: rubric)
      Current.tenant = nil
      c
    end

    it "creates and lists ratings" do
      mock_session(teacher, tenant: tenant)

      post "/api/v1/rubric_criteria/#{criterion.id}/ratings", params: { description: "Excellent", points: 25 }
      expect(response).to have_http_status(:created)

      get "/api/v1/rubric_criteria/#{criterion.id}/ratings"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.length).to eq(1)
    end

    it "updates a rating" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      rating = create(:rubric_rating, tenant: tenant, rubric_criterion: criterion)
      Current.tenant = nil

      patch "/api/v1/rubric_ratings/#{rating.id}", params: { description: "Updated" }
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["description"]).to eq("Updated")
    end

    it "deletes a rating" do
      mock_session(teacher, tenant: tenant)
      Current.tenant = tenant
      rating = create(:rubric_rating, tenant: tenant, rubric_criterion: criterion)
      Current.tenant = nil

      delete "/api/v1/rubric_ratings/#{rating.id}"
      expect(response).to have_http_status(:no_content)
    end
  end
end
