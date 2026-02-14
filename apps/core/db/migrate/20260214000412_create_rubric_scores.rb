class CreateRubricScores < ActiveRecord::Migration[8.1]
  def change
    create_table :rubric_scores do |t|
      t.references :tenant, null: false, foreign_key: true, index: true
      t.references :submission, null: false, foreign_key: true, index: true
      t.references :rubric_criterion, null: false, foreign_key: { to_table: :rubric_criteria }
      t.references :rubric_rating, foreign_key: true, null: true
      t.decimal :points_awarded, null: false
      t.text :comments
      t.timestamps
    end

    add_index :rubric_scores, [ :submission_id, :rubric_criterion_id ], unique: true, name: "idx_rubric_scores_sub_crit_unique"
  end
end
