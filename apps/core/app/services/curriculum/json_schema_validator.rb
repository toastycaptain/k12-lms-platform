module Curriculum
  class JsonSchemaValidator
    class ValidationError < StandardError
      attr_reader :errors

      def initialize(errors)
        @errors = errors
        super("Schema validation failed")
      end
    end

    class << self
      def validate!(schema:, data:)
        schema_hash = stringify_keys(schema || {})
        raise ArgumentError, "schema must be a Hash" unless schema_hash.is_a?(Hash)

        if remote_ref_present?(schema_hash)
          raise ValidationError, [ { message: "remote $ref is not allowed", type: "remote_ref_not_allowed" } ]
        end

        schemer = JSONSchemer.schema(schema_hash)
        errors = schemer.validate(data).map { |error| normalize_error(error) }
        raise ValidationError, errors if errors.any?

        true
      end

      private

      def normalize_error(error)
        {
          type: error[:type].to_s,
          message: error[:error].to_s,
          data_pointer: error[:data_pointer].to_s,
          schema_pointer: error[:schema_pointer].to_s,
          details: normalize_details(error[:details])
        }
      end

      def normalize_details(details)
        case details
        when Hash
          details.each_with_object({}) { |(key, value), memo| memo[key.to_s] = normalize_details(value) }
        when Array
          details.map { |value| normalize_details(value) }
        else
          details
        end
      end

      def remote_ref_present?(value)
        case value
        when Hash
          value.any? do |key, item|
            (key.to_s == "$ref" && item.to_s.match?(%r{\Ahttps?://}i)) || remote_ref_present?(item)
          end
        when Array
          value.any? { |item| remote_ref_present?(item) }
        else
          false
        end
      end

      def stringify_keys(value)
        case value
        when Hash
          value.each_with_object({}) do |(key, item), memo|
            memo[key.to_s] = stringify_keys(item)
          end
        when Array
          value.map { |item| stringify_keys(item) }
        else
          value
        end
      end
    end
  end
end
