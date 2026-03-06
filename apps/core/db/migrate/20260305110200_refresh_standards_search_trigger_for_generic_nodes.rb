class RefreshStandardsSearchTriggerForGenericNodes < ActiveRecord::Migration[8.1]
  FUNCTION_NAME = "standards_search_vector_update_fn".freeze
  TRIGGER_NAME = "standards_search_vector_update_tgr".freeze

  def up
    execute <<~SQL
      CREATE OR REPLACE FUNCTION #{FUNCTION_NAME}() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.code, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.identifier, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.label, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.grade_band, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(NEW.kind, '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    SQL

    execute <<~SQL
      DROP TRIGGER IF EXISTS #{TRIGGER_NAME} ON standards;
    SQL

    execute <<~SQL
      CREATE TRIGGER #{TRIGGER_NAME}
      BEFORE INSERT OR UPDATE ON standards
      FOR EACH ROW EXECUTE FUNCTION #{FUNCTION_NAME}();
    SQL
  end

  def down
    execute <<~SQL
      CREATE OR REPLACE FUNCTION #{FUNCTION_NAME}() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.code, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.grade_band, '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    SQL
  end
end
