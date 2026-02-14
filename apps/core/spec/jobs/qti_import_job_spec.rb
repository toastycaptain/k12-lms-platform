require "rails_helper"

RSpec.describe QtiImportJob do
  let(:tenant) { create(:tenant) }
  let(:teacher) do
    Current.tenant = tenant
    u = create(:user, tenant: tenant)
    u.add_role(:teacher)
    Current.tenant = nil
    u
  end
  let(:bank) do
    Current.tenant = tenant
    b = create(:question_bank, tenant: tenant, created_by: teacher)
    Current.tenant = nil
    b
  end

  let(:sample_qti_xml) do
    <<~XML
      <?xml version="1.0" encoding="UTF-8"?>
      <questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2">
        <assessment ident="test" title="Test Assessment">
          <section ident="root">
            <item ident="q1" title="What is 2+2?">
              <itemmetadata>
                <qtimetadata>
                  <qtimetadatafield>
                    <fieldlabel>question_type</fieldlabel>
                    <fieldentry>multiple_choice</fieldentry>
                  </qtimetadatafield>
                  <qtimetadatafield>
                    <fieldlabel>points_possible</fieldlabel>
                    <fieldentry>5</fieldentry>
                  </qtimetadatafield>
                </qtimetadata>
              </itemmetadata>
              <presentation>
                <material><mattext>What is 2+2?</mattext></material>
                <response_lid ident="response1" rcardinality="Single">
                  <render_choice>
                    <response_label ident="a"><material><mattext>3</mattext></material></response_label>
                    <response_label ident="b"><material><mattext>4</mattext></material></response_label>
                  </render_choice>
                </response_lid>
              </presentation>
              <resprocessing>
                <outcomes><decvar maxvalue="5" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
                <respcondition continue="No">
                  <conditionvar><varequal respident="response1">b</varequal></conditionvar>
                  <setvar varname="SCORE" action="Set">5</setvar>
                </respcondition>
              </resprocessing>
            </item>
            <item ident="q2" title="The sky is blue">
              <itemmetadata>
                <qtimetadata>
                  <qtimetadatafield>
                    <fieldlabel>question_type</fieldlabel>
                    <fieldentry>true_false</fieldentry>
                  </qtimetadatafield>
                </qtimetadata>
              </itemmetadata>
              <presentation>
                <material><mattext>The sky is blue</mattext></material>
                <response_lid ident="response1" rcardinality="Single">
                  <render_choice>
                    <response_label ident="true"><material><mattext>True</mattext></material></response_label>
                    <response_label ident="false"><material><mattext>False</mattext></material></response_label>
                  </render_choice>
                </response_lid>
              </presentation>
              <resprocessing>
                <outcomes><decvar maxvalue="1" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
                <respcondition continue="No">
                  <conditionvar><varequal respident="response1">true</varequal></conditionvar>
                  <setvar varname="SCORE" action="Set">1</setvar>
                </respcondition>
              </resprocessing>
            </item>
          </section>
        </assessment>
      </questestinterop>
    XML
  end

  after { Current.tenant = nil }

  it "imports QTI XML and creates questions" do
    blob = ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(sample_qti_xml),
      filename: "test.xml",
      content_type: "application/xml"
    )

    described_class.perform_now(bank.id, blob.id, teacher.id)

    bank.reload
    expect(bank.import_status).to eq("completed")
    expect(bank.import_errors).to eq([])

    Current.tenant = tenant
    questions = bank.questions.order(:id)
    expect(questions.length).to eq(2)

    mc = questions.first
    expect(mc.question_type).to eq("multiple_choice")
    expect(mc.points).to eq(5.0)
    expect(mc.correct_answer["key"]).to eq("b")

    tf = questions.last
    expect(tf.question_type).to eq("true_false")
    expect(tf.correct_answer["value"]).to eq(true)
    Current.tenant = nil
  end
end
