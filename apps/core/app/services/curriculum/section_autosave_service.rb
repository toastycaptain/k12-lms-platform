module Curriculum
  class SectionAutosaveService
    Result = Struct.new(:status, :curriculum_document, :version, :conflict, keyword_init: true)

    def initialize(document:, actor:, content:, title: nil, base_version_id: nil)
      @document = document
      @actor = actor
      @content = normalize_content(content)
      @title = title
      @base_version_id = base_version_id
    end

    def save!
      if base_version_id.present? && document.current_version_id.present? && document.current_version_id != base_version_id.to_i
        return Result.new(status: "conflict", curriculum_document: document, version: document.current_version, conflict: true)
      end

      current_content = document.current_version&.content || {}
      current_title = document.title
      return Result.new(status: "unchanged", curriculum_document: document, version: document.current_version, conflict: false) if current_content == content && current_title == resolved_title

      version = document.create_version!(title: resolved_title, content: content, created_by: actor)
      Result.new(status: "saved", curriculum_document: document.reload, version: version, conflict: false)
    end

    private

    attr_reader :document, :actor, :content, :title, :base_version_id

    def normalize_content(value)
      return value.to_unsafe_h if value.respond_to?(:to_unsafe_h)
      return value.to_h if value.respond_to?(:to_h) && !value.is_a?(Hash)

      value
    end

    def resolved_title
      title.presence || document.title
    end
  end
end
