require "rails_helper"
require Rails.root.join("lib/safe_migration")

RSpec.describe SafeMigration do
  let(:migration_class) do
    Class.new do
      include SafeMigration

      attr_reader :calls

      def initialize
        @calls = []
      end

      def change_column_default(*args)
        @calls << [ :default, *args ]
      end

      def change_column_null(*args)
        @calls << [ :null, *args ]
      end
    end
  end

  it "requires default when applying NOT NULL" do
    migration = migration_class.new

    expect do
      migration.safe_change_column_null(:users, :email, null: false)
    end.to raise_error(ArgumentError, /requires a default/)
  end

  it "applies default then NOT NULL safely" do
    migration = migration_class.new

    migration.safe_change_column_null(:users, :email, null: false, default: "")

    expect(migration.calls).to eq([
      [ :default, :users, :email, "" ],
      [ :null, :users, :email, false ]
    ])
  end

  it "raises for direct column rename" do
    migration = migration_class.new

    expect do
      migration.safe_rename_column(:users, :full_name, :name)
    end.to raise_error(ArgumentError, /Direct column renames are disallowed/)
  end
end
