class QtiExportJob < ApplicationJob
  queue_as :default

  def perform(question_bank_id)
    bank = QuestionBank.unscoped.find(question_bank_id)
    Current.tenant = bank.tenant

    xml = build_qti_xml(bank)

    bank.qti_export.attach(
      io: StringIO.new(xml),
      filename: "#{bank.title.parameterize}-qti.xml",
      content_type: "application/xml"
    )
  end

  private

  def build_qti_xml(bank)
    builder = Nokogiri::XML::Builder.new(encoding: "UTF-8") do |xml|
      xml.questestinterop(xmlns: "http://www.imsglobal.org/xsd/ims_qtiasiv1p2") do
        xml.assessment(ident: "bank-#{bank.id}", title: bank.title) do
          xml.section(ident: "root-section") do
            bank.questions.where(status: "active").find_each do |question|
              build_item(xml, question)
            end
          end
        end
      end
    end
    builder.to_xml
  end

  def build_item(xml, question)
    xml.item(ident: "question-#{question.id}", title: question.prompt.truncate(80)) do
      xml.itemmetadata do
        xml.qtimetadata do
          xml.qtimetadatafield do
            xml.fieldlabel("question_type")
            xml.fieldentry(question.question_type)
          end
          xml.qtimetadatafield do
            xml.fieldlabel("points_possible")
            xml.fieldentry(question.points.to_s)
          end
        end
      end

      xml.presentation do
        xml.material do
          xml.mattext(question.prompt, texttype: "text/plain")
        end

        case question.question_type
        when "multiple_choice"
          build_choice_interaction(xml, question)
        when "true_false"
          build_true_false_interaction(xml, question)
        when "short_answer", "fill_in_blank"
          xml.response_str(ident: "response1", rcardinality: "Single") do
            xml.render_fib do
              xml.response_label(ident: "answer1")
            end
          end
        end
      end

      build_resprocessing(xml, question)
    end
  end

  def build_choice_interaction(xml, question)
    xml.response_lid(ident: "response1", rcardinality: "Single") do
      xml.render_choice do
        Array(question.choices).each do |choice|
          xml.response_label(ident: choice["key"]) do
            xml.material do
              xml.mattext(choice["text"], texttype: "text/plain")
            end
          end
        end
      end
    end
  end

  def build_true_false_interaction(xml, question)
    xml.response_lid(ident: "response1", rcardinality: "Single") do
      xml.render_choice do
        xml.response_label(ident: "true") do
          xml.material { xml.mattext("True") }
        end
        xml.response_label(ident: "false") do
          xml.material { xml.mattext("False") }
        end
      end
    end
  end

  def build_resprocessing(xml, question)
    return unless question.correct_answer.present?

    xml.resprocessing do
      xml.outcomes do
        xml.decvar(maxvalue: question.points.to_s, minvalue: "0", varname: "SCORE", vartype: "Decimal")
      end

      xml.respcondition(continue: "No") do
        xml.conditionvar do
          case question.question_type
          when "multiple_choice"
            xml.varequal(question.correct_answer["key"], respident: "response1")
          when "true_false"
            xml.varequal(question.correct_answer["value"].to_s, respident: "response1")
          when "short_answer"
            Array(question.correct_answer["acceptable"]).each do |ans|
              xml.varequal(ans, respident: "response1")
            end
          end
        end
        xml.setvar(question.points.to_s, varname: "SCORE", action: "Set")
      end
    end
  end
end
