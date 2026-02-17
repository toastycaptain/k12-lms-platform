namespace :search do
  desc "Rebuild Postgres full-text search vectors for searchable models"
  task reindex: :environment do
    expressions = {
      unit_plans: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(title, '')), 'A')
      SQL
      lesson_plans: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(title, '')), 'A')
      SQL
      courses: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(code, '')), 'C')
      SQL
      standards: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(code, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(grade_band, '')), 'C')
      SQL
      assignments: <<~SQL.squish,
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(instructions, '')), 'C')
      SQL
      question_banks: <<~SQL.squish
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(subject, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(grade_level, '')), 'C')
      SQL
    }

    connection = ActiveRecord::Base.connection

    expressions.each do |table_name, expression|
      puts "Reindexing #{table_name}..."
      updated = connection.update("UPDATE #{table_name} SET search_vector = #{expression}")
      puts "  Updated #{updated} rows"
    end
  end
end
