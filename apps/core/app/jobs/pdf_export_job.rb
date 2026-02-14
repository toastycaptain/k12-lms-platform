Prawn::Fonts::AFM.hide_m17n_warning = true

class PdfExportJob < ApplicationJob
  queue_as :default

  def perform(unit_plan_id)
    unit_plan = UnitPlan.unscoped.includes(
      { lesson_plans: :current_version },
      { current_version: :standards }
    ).find(unit_plan_id)
    Current.tenant = unit_plan.tenant

    pdf = generate_pdf(unit_plan)

    unit_plan.exported_pdf.attach(
      io: StringIO.new(pdf),
      filename: "#{unit_plan.title.parameterize}-v#{unit_plan.current_version&.version_number || 1}.pdf",
      content_type: "application/pdf"
    )
  end

  private

  def generate_pdf(unit_plan)
    version = unit_plan.current_version

    Prawn::Document.new do |pdf|
      pdf.text unit_plan.title, size: 24, style: :bold
      pdf.move_down 10

      if version
        pdf.text "Version #{version.version_number}", size: 12, color: "666666"
        pdf.move_down 10

        if version.description.present?
          pdf.text "Description", size: 16, style: :bold
          pdf.move_down 5
          pdf.text version.description
          pdf.move_down 10
        end

        if version.essential_questions.present? && version.essential_questions.any?
          pdf.text "Essential Questions", size: 16, style: :bold
          pdf.move_down 5
          version.essential_questions.each do |question|
            pdf.text "\u2022 #{question}", indent_paragraphs: 10
          end
          pdf.move_down 10
        end

        if version.enduring_understandings.present? && version.enduring_understandings.any?
          pdf.text "Enduring Understandings", size: 16, style: :bold
          pdf.move_down 5
          version.enduring_understandings.each do |understanding|
            pdf.text "\u2022 #{understanding}", indent_paragraphs: 10
          end
          pdf.move_down 10
        end

        if version.standards.any?
          pdf.text "Aligned Standards", size: 16, style: :bold
          pdf.move_down 5
          version.standards.each do |standard|
            pdf.text "\u2022 #{standard.code}: #{standard.description}", indent_paragraphs: 10
          end
          pdf.move_down 10
        end
      end

      lessons = unit_plan.lesson_plans.order(:position)
      if lessons.any?
        pdf.text "Lessons", size: 18, style: :bold
        pdf.move_down 10

        lessons.each_with_index do |lesson, index|
          pdf.text "#{index + 1}. #{lesson.title}", size: 14, style: :bold
          pdf.move_down 5

          lv = lesson.current_version
          if lv
            if lv.objectives.present?
              pdf.text "Objectives:", style: :bold
              pdf.text lv.objectives
              pdf.move_down 5
            end

            if lv.duration_minutes.present?
              pdf.text "Duration: #{lv.duration_minutes} minutes"
              pdf.move_down 5
            end
          end

          pdf.move_down 10
        end
      end
    end.render
  end
end
