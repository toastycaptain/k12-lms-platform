require "rails_helper"

RSpec.describe SafeUrlValidator do
  let(:validatable_class) do
    Class.new do
      include ActiveModel::Model
      include ActiveModel::Validations
      attr_accessor :url
      validates :url, safe_url: true

      def self.model_name
        ActiveModel::Name.new(self, nil, "TestModel")
      end
    end
  end

  subject(:model) { validatable_class.new(url: url) }

  describe "valid URLs" do
    %w[
      https://example.com/api
      https://oneroster.school.edu/ims
      http://external-service.com:8080/path
    ].each do |valid_url|
      context "with #{valid_url}" do
        let(:url) { valid_url }
        it { is_expected.to be_valid }
      end
    end
  end

  describe "blocked internal hosts" do
    %w[
      http://localhost:3000/api
      http://127.0.0.1/secret
      http://0.0.0.0:8080/admin
      http://[::1]/api
      http://169.254.169.254/latest/meta-data/
      http://metadata.google.internal/computeMetadata/v1/
    ].each do |blocked_url|
      context "with #{blocked_url}" do
        let(:url) { blocked_url }
        it { is_expected.not_to be_valid }
      end
    end
  end

  describe "blocked private IP ranges" do
    %w[
      http://10.0.0.1/internal
      http://172.16.0.1/internal
      http://192.168.1.1/internal
    ].each do |private_url|
      context "with #{private_url}" do
        let(:url) { private_url }
        it { is_expected.not_to be_valid }
      end
    end
  end

  describe "blocked schemes" do
    %w[
      ftp://example.com/file
      file:///etc/passwd
      gopher://example.com
    ].each do |bad_scheme|
      context "with #{bad_scheme}" do
        let(:url) { bad_scheme }
        it { is_expected.not_to be_valid }
      end
    end
  end

  describe "blank URL" do
    let(:url) { "" }
    it "allows blank when using allow_blank" do
      klass = Class.new do
        include ActiveModel::Model
        include ActiveModel::Validations
        attr_accessor :url
        validates :url, safe_url: true, allow_blank: true
        def self.model_name
          ActiveModel::Name.new(self, nil, "TestModel")
        end
      end
      expect(klass.new(url: "")).to be_valid
    end
  end
end
