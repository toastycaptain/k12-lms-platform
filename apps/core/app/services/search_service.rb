class SearchService
  MIN_QUERY_LENGTH = 2
  DEFAULT_LIMIT = 10

  SEARCHABLE = {
    "unit_plan" => {
      model: UnitPlan,
      table: "unit_plans",
      vector_sql: "setweight(to_tsvector('english', coalesce(unit_plans.title, '')), 'A')",
      student_visible: false
    },
    "lesson_plan" => {
      model: LessonPlan,
      table: "lesson_plans",
      vector_sql: "setweight(to_tsvector('english', coalesce(lesson_plans.title, '')), 'A')",
      student_visible: false
    },
    "course" => {
      model: Course,
      table: "courses",
      vector_sql: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(courses.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(courses.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(courses.code, '')), 'C')
      SQL
      student_visible: true
    },
    "standard" => {
      model: Standard,
      table: "standards",
      vector_sql: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(standards.code, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(standards.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(standards.grade_band, '')), 'C')
      SQL
      student_visible: false
    },
    "assignment" => {
      model: Assignment,
      table: "assignments",
      vector_sql: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(assignments.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(assignments.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(assignments.instructions, '')), 'C')
      SQL
      student_visible: true
    },
    "question_bank" => {
      model: QuestionBank,
      table: "question_banks",
      vector_sql: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(question_banks.title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(question_banks.description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(question_banks.subject, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(question_banks.grade_level, '')), 'C')
      SQL
      student_visible: false
    }
  }.freeze

  def search(query:, user:, types: nil, limit: DEFAULT_LIMIT)
    normalized_query = normalize_query(query)
    return [] if normalized_query.length < MIN_QUERY_LENGTH

    tokens = normalized_query.split(" ").uniq
    return [] if tokens.empty?

    prefix_query = build_tsquery(tokens)
    limit_value = normalize_limit(limit)
    target_types = resolve_types(types, user)
    return [] if target_types.empty?

    target_types.flat_map do |type|
      search_type(type, prefix_query, normalized_query, user, limit_value)
    end.sort_by { |result| [ -result[:rank].to_f, result[:title].to_s.downcase, result[:id].to_i ] }
      .first(limit_value)
  end

  private

  def search_type(type, prefix_query, plain_query, user, limit)
    config = SEARCHABLE.fetch(type)
    scope = Pundit.policy_scope!(user, config[:model])
    prefix_sql = tsquery_sql(prefix_query)
    plain_sql = plainto_tsquery_sql(plain_query)
    vector_sql = "COALESCE(#{config[:table]}.search_vector, #{config[:vector_sql]})"

    scope
      .where("(#{vector_sql} @@ #{prefix_sql}) OR (#{vector_sql} @@ #{plain_sql})")
      .select(
        "#{config[:table]}.*, GREATEST(ts_rank(#{vector_sql}, #{prefix_sql}), ts_rank(#{vector_sql}, #{plain_sql})) AS search_rank"
      )
      .order(Arel.sql("search_rank DESC, #{config[:table]}.id ASC"))
      .limit(limit)
      .map { |record| format_result(record, type, user) }
  rescue ActiveRecord::StatementInvalid
    []
  end

  def format_result(record, type, user)
    {
      type: type,
      id: record.id,
      title: result_title(record, type),
      url: result_url(record, type, user),
      rank: search_rank(record)
    }
  end

  def result_title(record, type)
    case type
    when "course"
      record.name
    when "standard"
      description = truncate(record.description.to_s, 60)
      [ record.code, description ].reject(&:blank?).join(": ")
    when "question_bank"
      record.title
    else
      record.title
    end
  end

  def result_url(record, type, user)
    case type
    when "unit_plan"
      "/plan/units/#{record.id}"
    when "lesson_plan"
      "/plan/units/#{record.unit_plan_id}/lessons/#{record.id}"
    when "course"
      student_only_user?(user) ? "/learn/courses/#{record.id}" : "/teach/courses/#{record.id}"
    when "standard"
      "/plan/standards"
    when "assignment"
      base = student_only_user?(user) ? "/learn/courses" : "/teach/courses"
      "#{base}/#{record.course_id}/assignments/#{record.id}"
    when "question_bank"
      "/assess/banks/#{record.id}"
    else
      "/"
    end
  end

  def search_rank(record)
    raw = record.respond_to?(:search_rank) ? record.search_rank : record.attributes["search_rank"]
    raw.to_f.round(6)
  end

  def resolve_types(types, user)
    requested = if types.blank?
      SEARCHABLE.keys
    elsif types.is_a?(String)
      types.split(",")
    else
      Array(types)
    end

    requested.map(&:to_s)
             .map(&:strip)
             .reject(&:blank?)
             .uniq
             .select { |type| SEARCHABLE.key?(type) }
             .select { |type| SEARCHABLE[type][:student_visible] || !student_only_user?(user) }
  end

  def student_only_user?(user)
    user.has_role?(:student) &&
      !user.has_role?(:teacher) &&
      !user.has_role?(:admin) &&
      !user.has_role?(:curriculum_lead)
  end

  def normalize_query(query)
    query.to_s.gsub(/[^\p{Alnum}\s]/, " ").squish
  end

  def build_tsquery(tokens)
    tokens.map { |token| "#{token}:*" }.join(" & ")
  end

  def tsquery_sql(tsquery)
    "to_tsquery('english', #{ActiveRecord::Base.connection.quote(tsquery)})"
  end

  def plainto_tsquery_sql(query)
    "plainto_tsquery('english', #{ActiveRecord::Base.connection.quote(query)})"
  end

  def normalize_limit(limit)
    value = limit.to_i
    return DEFAULT_LIMIT if value <= 0

    [ value, 50 ].min
  end

  def truncate(value, max_length)
    return value if value.length <= max_length

    "#{value.first(max_length - 3)}..."
  end
end
