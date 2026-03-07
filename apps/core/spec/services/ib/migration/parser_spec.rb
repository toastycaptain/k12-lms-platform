require "rails_helper"
require "base64"
require "erb"
require "zip"

RSpec.describe Ib::Migration::Parser do
  def minimal_xlsx_base64(headers:, rows:)
    workbook_xml = <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <sheets>
          <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
        </sheets>
      </workbook>
    XML

    worksheet_rows = ([ headers ] + rows).each_with_index.map do |values, row_index|
      cells = values.each_with_index.map do |value, column_index|
        column = ("A".ord + column_index).chr
        <<~XML.strip
          <c r="#{column}#{row_index + 1}" t="inlineStr"><is><t>#{ERB::Util.html_escape(value.to_s)}</t></is></c>
        XML
      end.join
      %(<row r="#{row_index + 1}">#{cells}</row>)
    end.join

    worksheet_xml = <<~XML
      <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>#{worksheet_rows}</sheetData>
      </worksheet>
    XML

    buffer = Zip::OutputStream.write_buffer do |zip|
      zip.put_next_entry("[Content_Types].xml")
      zip.write <<~XML
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
          <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
        </Types>
      XML
      zip.put_next_entry("_rels/.rels")
      zip.write <<~XML
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
        </Relationships>
      XML
      zip.put_next_entry("xl/workbook.xml")
      zip.write(workbook_xml)
      zip.put_next_entry("xl/_rels/workbook.xml.rels")
      zip.write <<~XML
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
        </Relationships>
      XML
      zip.put_next_entry("xl/worksheets/sheet1.xml")
      zip.write(worksheet_xml)
    end

    Base64.strict_encode64(buffer.string)
  end

  it "normalizes messy CSV headers and skips blank rows" do
    payload = "title,title,,planning context name\nUnit 1,Duplicate,,Grade 5 PYP\n,,,\n"

    parsed = described_class.parse(source_format: "csv", raw_payload: payload)

    expect(parsed[:warnings]).to include(
      "Duplicate header title was renamed to title__2.",
      "Blank header at column 3 was renamed to column_3.",
    )
    expect(parsed[:rows].length).to eq(1)
    expect(parsed[:rows].first[:payload]).to include(
      "title" => "Unit 1",
      "title__2" => "Duplicate",
      "planning context name" => "Grade 5 PYP",
    )
  end

  it "parses xlsx uploads into staged rows with normalized headers" do
    raw_payload = minimal_xlsx_base64(
      headers: [ "title", "planning context name" ],
      rows: [ [ "Imported unit", "Grade 6 PYP" ] ],
    )

    parsed = described_class.parse(source_format: "xlsx", raw_payload: raw_payload)

    expect(parsed[:warnings]).to eq([])
    expect(parsed[:rows]).to contain_exactly(
      include(
        sheet_name: "Sheet1",
        row_index: 2,
        source_identifier: "Sheet1:2",
        payload: {
          "title" => "Imported unit",
          "planning context name" => "Grade 6 PYP"
        },
      ),
    )
  end
end
