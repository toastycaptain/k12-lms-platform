require "rails_helper"

RSpec.describe AiInvocation, type: :model do
  let(:tenant) { create(:tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:ai_provider_config) }
    it { should belong_to(:ai_task_policy).optional }
    it { should belong_to(:ai_template).optional }
  end

  describe "validations" do
    it { should validate_presence_of(:task_type) }
    it { should validate_presence_of(:provider_name) }
    it { should validate_presence_of(:model) }
    it { should validate_inclusion_of(:status).in_array(AiInvocation::VALID_STATUSES) }
  end

  describe "status methods" do
    let(:record) { create(:ai_invocation, tenant: tenant, status: "pending", context: { "messages" => [] }) }

    it "completes with token stats" do
      record.complete!(tokens: { prompt: 1, completion: 2, total: 3 }, duration: 44)

      record.reload
      expect(record.status).to eq("completed")
      expect(record.prompt_tokens).to eq(1)
      expect(record.completion_tokens).to eq(2)
      expect(record.total_tokens).to eq(3)
      expect(record.duration_ms).to eq(44)
      expect(record.completed_at).to be_present
    end

    it "normalizes alternative token key names" do
      record.complete!(tokens: { "prompt_tokens" => 4, "completion_tokens" => 6, "total_tokens" => 10 }, duration: 50)

      record.reload
      expect(record.prompt_tokens).to eq(4)
      expect(record.completion_tokens).to eq(6)
      expect(record.total_tokens).to eq(10)
    end

    it "stores response payload in context" do
      response = { "content" => "hello" }

      record.complete!(tokens: { prompt: 1, completion: 1, total: 2 }, duration: 30, response_hash: response)

      expect(record.reload.context["response"]).to eq(response)
    end

    it "fails with error message" do
      record.fail!("gateway error")

      expect(record.reload.status).to eq("failed")
      expect(record.error_message).to eq("gateway error")
      expect(record.completed_at).to be_present
    end
  end

  describe "tenant scoping" do
    it "returns only records for current tenant" do
      t1 = create(:tenant)
      t2 = create(:tenant)
      Current.tenant = t1
      i1 = create(:ai_invocation, tenant: t1)
      Current.tenant = t2
      create(:ai_invocation, tenant: t2)

      Current.tenant = t1
      expect(AiInvocation.all).to contain_exactly(i1)
    end
  end
end
