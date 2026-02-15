class AddOnboardingFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    unless column_exists?(:users, :onboarding_complete)
      add_column :users, :onboarding_complete, :boolean, default: false, null: false
    end

    unless column_exists?(:users, :preferences)
      add_column :users, :preferences, :jsonb, default: {}, null: false
    end
  end
end
