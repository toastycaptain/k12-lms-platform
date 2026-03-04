#!/usr/bin/env ruby
# frozen_string_literal: true

require "bundler"
require "json"
require "pathname"
require "time"

lockfile = Pathname.new(ARGV[0] || File.expand_path("../Gemfile.lock", __dir__))
output = Pathname.new(ARGV[1] || File.expand_path("../../sbom-core.json", __dir__))

unless lockfile.exist?
  warn "Gemfile.lock not found at #{lockfile}"
  exit(1)
end

parser = Bundler::LockfileParser.new(lockfile.read)
components = parser.specs.map do |spec|
  {
    name: spec.name,
    version: spec.version.to_s,
    source: spec.source.class.name,
    dependencies: spec.dependencies.map(&:name).sort
  }
end.sort_by { |component| [ component[:name], component[:version] ] }

inventory = {
  schema: "k12-dependency-inventory-v1",
  generated_at: Time.now.utc.iso8601,
  ecosystem: "ruby",
  source_lockfile: lockfile.to_s,
  component_count: components.length,
  components: components
}

output.dirname.mkpath
output.write(JSON.pretty_generate(inventory) + "\n")
puts "Wrote dependency inventory to #{output}"
