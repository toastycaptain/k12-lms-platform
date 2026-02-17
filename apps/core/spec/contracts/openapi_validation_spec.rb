require "rails_helper"
require "yaml"

RSpec.describe "OpenAPI route coverage", type: :request do
  let(:spec_path) { File.expand_path("../../../../packages/contracts/core-v1.openapi.yaml", __dir__) }
  let(:openapi) { YAML.safe_load(File.read(spec_path), permitted_classes: [ Date, Time ]) }
  let(:ignored_paths) { [ "/api/v1/testing/session" ] }

  def canonicalize_path(path)
    path
      .sub("(.:format)", "")
      .gsub(/:([a-zA-Z_]+)/, '{\1}')
      .gsub(/\{[^}]+\}/, "{}")
  end

  def routed_operations
    Rails.application.routes.routes.flat_map do |route|
      path = route.path.spec.to_s
      next [] unless path.start_with?("/api/v1/")

      verbs = route.verb.to_s.scan(/[A-Z]+/).map(&:downcase).uniq
      normalized_path = canonicalize_path(path)
      next [] if ignored_paths.include?(normalized_path)

      verbs.map { |verb| [ verb, normalized_path ] }
    end.uniq
  end

  def documented_operations
    openapi.fetch("paths").flat_map do |path, operations|
      next [] unless operations.is_a?(Hash)

      operations.keys
                .select { |method| %w[get post put patch delete].include?(method) }
                .map { |method| [ method, canonicalize_path(path) ] }
    end.uniq
  end

  it "documents every routed API operation" do
    documented = documented_operations

    missing = routed_operations.reject do |verb, path|
      documented.include?([ verb, path ]) ||
        (verb == "put" && documented.include?([ "patch", path ])) ||
        (verb == "patch" && documented.include?([ "put", path ]))
    end

    expect(missing).to be_empty,
      "Undocumented route operations:\n" \
      "#{missing.sort.map { |verb, path| "#{verb.upcase} #{path}" }.join("\n")}"
  end
end
