require "rails_helper"
require "yaml"

RSpec.describe "OpenAPI specification", type: :model do
  let(:spec_path) { File.expand_path("../../../../packages/contracts/core-v1.openapi.yaml", __dir__) }
  let(:spec) { YAML.safe_load(File.read(spec_path), permitted_classes: [ Date, Time ]) }

  it "parses as valid YAML" do
    expect { YAML.safe_load(File.read(spec_path), permitted_classes: [ Date, Time ]) }.not_to raise_error
  end

  it "declares OpenAPI 3.x version" do
    expect(spec["openapi"]).to match(/\A3\.\d+\.\d+\z/)
  end

  it "has required top-level keys" do
    expect(spec).to include("openapi", "info", "paths", "components")
    expect(spec["info"]).to include("title", "version")
  end

  it "has at least 20 path operations" do
    operation_count = spec["paths"].sum do |_path, methods|
      methods.count { |method, _| %w[get post put patch delete].include?(method) }
    end
    expect(operation_count).to be >= 20
  end

  it "every path starts with /api/v1/" do
    spec["paths"].each_key do |path|
      expect(path).to start_with("/api/v1/"), "#{path} does not start with /api/v1/"
    end
  end

  it "every operation has a summary and operationId" do
    spec["paths"].each do |path, methods|
      methods.each do |method, operation|
        next if method == "parameters"
        next unless operation.is_a?(Hash)

        expect(operation).to have_key("summary"), "#{method.upcase} #{path} missing summary"
        expect(operation).to have_key("operationId"), "#{method.upcase} #{path} missing operationId"
      end
    end
  end

  it "all operationIds are unique" do
    ids = []
    spec["paths"].each do |_path, methods|
      methods.each do |method, operation|
        next if method == "parameters"
        next unless operation.is_a?(Hash)

        ids << operation["operationId"]
      end
    end
    expect(ids.uniq.length).to eq(ids.length), "Duplicate operationIds: #{ids.group_by(&:itself).select { |_, v| v.size > 1 }.keys}"
  end

  it "all $ref targets resolve" do
    refs = extract_refs(spec)
    refs.each do |ref|
      parts = ref.delete_prefix("#/").split("/")
      node = spec
      parts.each do |part|
        expect(node).to be_a(Hash), "$ref '#{ref}' — segment '#{part}' not found"
        node = node[part]
        expect(node).not_to be_nil, "$ref '#{ref}' does not resolve (missing '#{part}')"
      end
    end
  end

  it "every schema has a type field" do
    schemas = spec.dig("components", "schemas") || {}
    schemas.each do |name, schema|
      expect(schema).to have_key("type"), "Schema '#{name}' missing type"
    end
  end

  it "every required field exists in properties" do
    schemas = spec.dig("components", "schemas") || {}
    schemas.each do |name, schema|
      next unless schema["required"] && schema["properties"]

      schema["required"].each do |field|
        expect(schema["properties"]).to have_key(field),
          "Schema '#{name}' lists '#{field}' as required but it's not in properties"
      end
    end
  end

  private

  def extract_refs(obj, refs = [])
    case obj
    when Hash
      if obj.key?("$ref")
        refs << obj["$ref"]
      else
        obj.each_value { |v| extract_refs(v, refs) }
      end
    when Array
      obj.each { |v| extract_refs(v, refs) }
    end
    refs
  end
end
