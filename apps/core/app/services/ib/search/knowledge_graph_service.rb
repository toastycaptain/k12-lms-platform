module Ib
  module Search
    class KnowledgeGraphService
      def initialize(results:)
        @results = Array(results)
      end

      def payload
        {
          concepts: concept_nodes,
          links: relation_links,
          related_results: related_results
        }
      end

      private

      attr_reader :results

      def concept_nodes
        concept_scores
          .sort_by { |concept, score| [ -score, concept ] }
          .first(6)
          .map do |concept, score|
            {
              key: concept.parameterize(separator: "_"),
              label: concept,
              strength: score
            }
          end
      end

      def relation_links
        results.combination(2).filter_map do |left, right|
          relation = shared_relation(left, right)
          next unless relation

          {
            source: left[:entity_ref],
            target: right[:entity_ref],
            relation: relation
          }
        end.first(8)
      end

      def related_results
        results.first(5).map do |result|
          {
            title: result[:title],
            href: result[:href],
            kind: result[:kind],
            relation:
              relation_links.find do |link|
                link[:source] == result[:entity_ref] || link[:target] == result[:entity_ref]
              end&.dig(:relation) || "query_match"
          }
        end
      end

      def concept_scores
        @concept_scores ||= results.each_with_object(Hash.new(0)) do |result, memo|
          Array(result[:keywords]).each { |keyword| memo[keyword.to_s.tr("_", " ").titleize] += 2 if keyword.present? }
          memo[result[:programme]] += 1 if result[:programme].present?
          memo[result[:kind].to_s.tr("_", " ").titleize] += 1 if result[:kind].present?
        end
      end

      def shared_relation(left, right)
        return "shared_record_family" if left[:kind] == right[:kind]
        return "same_programme" if left[:programme].present? && left[:programme] == right[:programme]

        left_keywords = Array(left[:keywords]).map(&:to_s)
        right_keywords = Array(right[:keywords]).map(&:to_s)
        overlap = left_keywords & right_keywords
        return "shared_concept:#{overlap.first}" if overlap.any?

        nil
      end
    end
  end
end
