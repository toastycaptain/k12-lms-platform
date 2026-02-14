class QtiImportJob < ApplicationJob
  queue_as :default

  def perform(question_bank_id, blob_id, user_id)
    bank = QuestionBank.unscoped.find(question_bank_id)
    Current.tenant = bank.tenant
    user = User.unscoped.find(user_id)

    bank.update!(import_status: "processing", import_errors: [])

    blob = ActiveStorage::Blob.find(blob_id)
    xml_content = blob.download
    doc = Nokogiri::XML(xml_content)
    doc.remove_namespaces!

    errors = []
    items = doc.xpath("//item")

    items.each do |item|
      import_item(bank, item, user, errors)
    end

    bank.update!(
      import_status: errors.any? ? "completed_with_warnings" : "completed",
      import_errors: errors
    )
  end

  private

  def import_item(bank, item, user, errors)
    title = item["title"] || "Imported Question"
    question_type = detect_type(item)

    unless question_type
      errors << { item: title, error: "Unrecognized question type" }
      return
    end

    attrs = build_question_attrs(item, question_type, title)
    bank.questions.create!(
      tenant: bank.tenant,
      created_by: user,
      prompt: title,
      question_type: question_type,
      points: attrs[:points],
      choices: attrs[:choices],
      correct_answer: attrs[:correct_answer]
    )
  rescue ActiveRecord::RecordInvalid => e
    errors << { item: title, error: e.message }
  end

  def detect_type(item)
    metadata_type = item.at_xpath(".//qtimetadatafield[fieldlabel='question_type']/fieldentry")&.text
    return metadata_type if metadata_type && Question::VALID_TYPES.include?(metadata_type)

    if item.at_xpath(".//render_choice")
      labels = item.xpath(".//response_label")
      idents = labels.map { |l| l["ident"] }
      if idents.sort == %w[false true]
        "true_false"
      else
        "multiple_choice"
      end
    elsif item.at_xpath(".//render_fib")
      "short_answer"
    end
  end

  def build_question_attrs(item, question_type, _title)
    points_str = item.at_xpath(".//qtimetadatafield[fieldlabel='points_possible']/fieldentry")&.text
    points = points_str ? points_str.to_f : 1.0

    case question_type
    when "multiple_choice"
      choices = item.xpath(".//response_label").map do |label|
        { "key" => label["ident"], "text" => label.at_xpath(".//mattext")&.text || "" }
      end
      correct_key = item.at_xpath(".//respcondition//varequal")&.text
      { points: points, choices: choices, correct_answer: { "key" => correct_key } }
    when "true_false"
      correct_val = item.at_xpath(".//respcondition//varequal")&.text
      {
        points: points,
        choices: [ { "key" => "true", "text" => "True" }, { "key" => "false", "text" => "False" } ],
        correct_answer: { "value" => correct_val == "true" }
      }
    when "short_answer"
      acceptable = item.xpath(".//respcondition//varequal").map(&:text)
      { points: points, choices: nil, correct_answer: { "acceptable" => acceptable } }
    else
      { points: points, choices: nil, correct_answer: nil }
    end
  end
end
