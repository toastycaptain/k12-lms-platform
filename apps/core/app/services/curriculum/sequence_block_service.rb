module Curriculum
  class SequenceBlockService
    def initialize(document:, actor:)
      @document = document
      @actor = actor
    end

    def reorder!(ordered_ids:)
      blocks = current_blocks.index_by { |block| block["id"] }
      reordered = ordered_ids.filter_map { |id| blocks[id.to_s] }
      save_blocks!(reordered)
    end

    def save_template!(title:)
      IbSpecialistLibraryItem.create!(
        tenant: document.tenant,
        school: document.school,
        created_by: actor,
        programme: inferred_programme,
        item_type: "sequence",
        title: title,
        summary: "Saved from #{document.title}",
        content: {
          "blocks" => current_blocks,
          "document_ref" => Ib::RouteBuilder.entity_ref_for(document)
        },
        source_entity_ref: Ib::RouteBuilder.entity_ref_for(document),
        metadata: {
          "document_type" => document.document_type,
          "schema_key" => document.schema_key
        }
      )
    end

    def apply_template!(library_item:)
      save_blocks!(Array(library_item.content["blocks"]).map(&:deep_dup))
    end

    private

    attr_reader :document, :actor

    def current_blocks
      blocks = document.current_version&.content&.dig("sequence_blocks")
      Array(blocks).map.with_index do |block, index|
        normalized = block.is_a?(Hash) ? block.deep_stringify_keys : { "label" => block.to_s }
        normalized["id"] ||= "block-#{index + 1}"
        normalized["position"] = index
        normalized
      end
    end

    def save_blocks!(blocks)
      content = (document.current_version&.content || {}).deep_dup
      content["sequence_blocks"] = blocks.each_with_index.map do |block, index|
        block.merge("position" => index)
      end
      document.create_version!(title: document.title, content: content, created_by: actor)
    end

    def inferred_programme
      type = document.document_type.to_s
      return "PYP" if type.start_with?("ib_pyp")
      return "MYP" if type.start_with?("ib_myp")
      return "DP" if type.start_with?("ib_dp")

      "Mixed"
    end
  end
end
