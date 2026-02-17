class GradebookExportService
  def initialize(course:, payload:)
    @course = course
    @payload = payload
  end

  def call
    rows = []
    rows << headers
    student_rows.each { |row| rows << csv_row_for_student(row) }
    rows << summary_row

    rows.map { |row| row.map { |value| escape_csv(value) }.join(",") }.join("\n") + "\n"
  end

  private

  attr_reader :course, :payload

  def headers
    [ "Student Name", "Email", *assignment_titles, "Course Average", "Missing", "Late", "Mastery" ]
  end

  def student_rows
    payload.fetch(:students)
  end

  def assignments
    payload.fetch(:assignments)
  end

  def assignment_titles
    assignments.map { |assignment| assignment.fetch(:title) }
  end

  def csv_row_for_student(student_row)
    [
      student_row.fetch(:name),
      student_row.fetch(:email),
      *assignment_cell_values(student_row.fetch(:grades)),
      format_percentage(student_row[:course_average]),
      student_row.fetch(:missing_count),
      student_row.fetch(:late_count),
      format_mastery(student_row[:mastery])
    ]
  end

  def assignment_cell_values(grade_cells)
    grade_cells.map do |cell|
      if cell[:missing]
        "MISSING"
      elsif cell[:grade].present?
        value = format_number(cell[:grade])
        cell[:late] ? "#{value} (LATE)" : value
      else
        "-"
      end
    end
  end

  def summary_row
    assignment_averages = assignments.map { |assignment| format_percentage(assignment[:average]) }

    [
      "Class Average",
      "",
      *assignment_averages,
      format_percentage(payload.dig(:course_summary, :overall_average)),
      payload.dig(:course_summary, :students_with_missing_work),
      "",
      ""
    ]
  end

  def format_mastery(mastery)
    return "-" if mastery.blank?

    "#{format_percentage(mastery[:percentage])} (#{mastery[:mastered_standards]}/#{mastery[:total_standards]})"
  end

  def format_percentage(value)
    return "-" if value.blank?

    "#{format_number(value)}%"
  end

  def format_number(value)
    value.to_f.round(2).to_s
  end

  def escape_csv(value)
    string_value = value.to_s
    if string_value.include?(",") || string_value.include?("\"") || string_value.include?("\n")
      "\"#{string_value.gsub("\"", "\"\"")}\""
    else
      string_value
    end
  end
end
