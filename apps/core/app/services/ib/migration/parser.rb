require "csv"
require "base64"
require "roo"
require "tempfile"

module Ib
  module Migration
    class Parser
      class ParseError < StandardError; end

      class << self
        def parse(source_format:, raw_payload:)
          case source_format.to_s
          when "csv"
            parse_csv(raw_payload.to_s)
          when "xlsx"
            parse_xlsx(raw_payload.to_s)
          else
            raise ParseError, "Unsupported source format: #{source_format}"
          end
        end

        private

        def parse_csv(raw_payload)
          table = CSV.parse(raw_payload, headers: true, liberal_parsing: true)
          headers, header_warnings = normalized_headers(Array(table.headers))
          rows = []
          warnings = header_warnings

          table.each_with_index do |row, index|
            next if row.to_h.values.all? { |value| value.to_s.strip.blank? }

            rows << {
              sheet_name: "csv",
              row_index: index + 2,
              source_identifier: "csv:#{index + 2}",
              payload: build_payload(headers, row.fields),
              warnings: []
            }
          end

          { rows: rows, warnings: warnings }
        end

        def parse_xlsx(raw_payload)
          tempfile = Tempfile.new([ "ib-import", ".xlsx" ])
          tempfile.binmode
          tempfile.write(Base64.decode64(raw_payload))
          tempfile.flush
          workbook = Roo::Spreadsheet.open(tempfile.path)
          warnings = []
          rows = workbook.sheets.flat_map do |sheet_name|
            sheet = workbook.sheet(sheet_name)
            header_row, header_warnings = normalized_headers(Array(sheet.row(1)))
            warnings.concat(header_warnings.map { |warning| "#{sheet_name}: #{warning}" })
            next [] if sheet.last_row.to_i.zero?

            (2..sheet.last_row.to_i).filter_map do |row_number|
              values = Array(sheet.row(row_number))
              next if values.all? { |value| value.to_s.strip.blank? }

              payload = build_payload(header_row, values)
              {
                sheet_name: sheet_name,
                row_index: row_number,
                source_identifier: "#{sheet_name}:#{row_number}",
                payload: payload,
                warnings: []
              }
            end
          end
          { rows: rows, warnings: warnings }
        rescue StandardError => e
          raise ParseError, e.message
        ensure
          tempfile&.close!
        end

        def normalized_headers(raw_headers)
          warnings = []
          counts = Hash.new(0)
          headers = Array(raw_headers).each_with_index.map do |header, index|
            base = header.to_s.strip
            if base.blank?
              base = "column_#{index + 1}"
              warnings << "Blank header at column #{index + 1} was renamed to #{base}."
            end
            counts[base] += 1
            if counts[base] > 1
              suffixed = "#{base}__#{counts[base]}"
              warnings << "Duplicate header #{base} was renamed to #{suffixed}."
              suffixed
            else
              base
            end
          end

          [ headers, warnings ]
        end

        def build_payload(headers, values)
          Array(values).each_with_index.each_with_object({}) do |(value, index), memo|
            header = headers[index] || "column_#{index + 1}"
            memo[header] = normalize_value(value)
          end
        end

        def normalize_value(value)
          case value
          when Date
            value.iso8601
          when Time, DateTime
            value.iso8601
          else
            value
          end
        end
      end
    end
  end
end
