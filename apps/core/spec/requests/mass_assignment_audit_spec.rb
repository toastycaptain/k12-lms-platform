require "rails_helper"

RSpec.describe "Mass Assignment Audit", type: :request do
  describe "no to_unsafe_h in controllers" do
    it "codebase does not contain to_unsafe_h" do
      controller_files = Dir.glob(Rails.root.join("app/controllers/**/*.rb"))
      violations = controller_files.select do |file|
        File.read(file).include?("to_unsafe_h")
      end

      expect(violations).to be_empty,
        "Found to_unsafe_h in: #{violations.map { |f| f.sub(Rails.root.to_s, '') }.join(', ')}"
    end
  end

  describe "no open settings: {} in params.permit" do
    it "codebase does not permit arbitrary settings hash" do
      controller_files = Dir.glob(Rails.root.join("app/controllers/**/*.rb"))
      violations = controller_files.select do |file|
        content = File.read(file)
        content.match?(/\.permit\([^)]*(?:settings|metadata|preferences):\s*\{\s*\}/)
      end

      expect(violations).to be_empty,
        "Found open hash permit in: #{violations.map { |f| f.sub(Rails.root.to_s, '') }.join(', ')}"
    end
  end
end
