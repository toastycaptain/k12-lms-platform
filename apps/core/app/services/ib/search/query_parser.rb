module Ib
  module Search
    class QueryParser
      ParsedQuery = Struct.new(
        :raw,
        :text,
        :normalized,
        :tokens,
        :filters,
        :unsupported_filters,
        keyword_init: true
      )

      SUPPORTED_FILTERS = %w[
        kind
        programme
        status
        audience
        visibility
        student
        owner
        lens
      ].freeze

      TOKEN_PATTERN = /
        (?<key>[a-z_]+):
        (?:
          "(?<quoted>[^"]+)" |
          (?<bare>[^\s]+)
        )
      /ix.freeze

      def initialize(raw_query:, explicit_filters: {})
        @raw_query = raw_query.to_s
        @explicit_filters = normalize_filters(explicit_filters)
      end

      def parse
        filters = explicit_filters.deep_dup
        unsupported_filters = []
        working_query = raw_query.dup

        raw_query.to_enum(:scan, TOKEN_PATTERN).map { Regexp.last_match }.each do |match|
          key = match[:key].to_s.downcase
          value = match[:quoted].presence || match[:bare].to_s

          if SUPPORTED_FILTERS.include?(key)
            filters[key] ||= []
            filters[key] << value
          else
            unsupported_filters << { key: key, value: value }
          end

          working_query.sub!(match[0], " ")
        end

        text = normalize_text(working_query)

        ParsedQuery.new(
          raw: raw_query.strip,
          text: text,
          normalized: text.downcase,
          tokens: text.downcase.scan(/[[:alnum:]_]+/),
          filters: filters.transform_values { |values| values.map(&:to_s).map(&:strip).reject(&:blank?).uniq },
          unsupported_filters: unsupported_filters
        )
      end

      private

      attr_reader :raw_query, :explicit_filters

      def normalize_filters(value)
        return {} unless value.is_a?(Hash)

        value.each_with_object({}) do |(key, raw_value), memo|
          values =
            Array(raw_value)
              .flat_map { |entry| entry.to_s.split(",") }
              .map(&:strip)
              .reject(&:blank?)
          memo[key.to_s] = values if values.any?
        end
      end

      def normalize_text(value)
        value.to_s.gsub(/\s+/, " ").strip
      end
    end
  end
end
