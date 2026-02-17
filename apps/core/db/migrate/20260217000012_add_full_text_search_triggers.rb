class AddFullTextSearchTriggers < ActiveRecord::Migration[8.1]
  SEARCH_EXPRESSIONS = {
    unit_plans: <<~SQL.squish,
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A')
    SQL
    lesson_plans: <<~SQL.squish,
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A')
    SQL
    courses: <<~SQL.squish,
      setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.code, '')), 'C')
    SQL
    standards: <<~SQL.squish,
      setweight(to_tsvector('english', coalesce(NEW.code, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.grade_band, '')), 'C')
    SQL
    assignments: <<~SQL.squish,
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.instructions, '')), 'C')
    SQL
    question_banks: <<~SQL.squish
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.subject, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.grade_level, '')), 'C')
    SQL
  }.freeze

  def up
    SEARCH_EXPRESSIONS.each do |table_name, expression|
      execute <<~SQL
        CREATE OR REPLACE FUNCTION #{search_function_name(table_name)}() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector := #{expression};
          RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
      SQL

      execute <<~SQL
        DROP TRIGGER IF EXISTS #{search_trigger_name(table_name)} ON #{table_name};
      SQL

      execute <<~SQL
        CREATE TRIGGER #{search_trigger_name(table_name)}
        BEFORE INSERT OR UPDATE ON #{table_name}
        FOR EACH ROW EXECUTE FUNCTION #{search_function_name(table_name)}();
      SQL
    end
  end

  def down
    SEARCH_EXPRESSIONS.each_key do |table_name|
      execute <<~SQL
        DROP TRIGGER IF EXISTS #{search_trigger_name(table_name)} ON #{table_name};
      SQL

      execute <<~SQL
        DROP FUNCTION IF EXISTS #{search_function_name(table_name)}();
      SQL
    end
  end

  private

  def search_function_name(table_name)
    "#{table_name}_search_vector_update_fn"
  end

  def search_trigger_name(table_name)
    "#{table_name}_search_vector_update_tgr"
  end
end
