class AddCounterCaches < ActiveRecord::Migration[8.1]
  def up
    add_column :courses, :assignments_count, :integer, default: 0, null: false unless column_exists?(:courses, :assignments_count)
    add_column :courses, :enrollments_count, :integer, default: 0, null: false unless column_exists?(:courses, :enrollments_count)
    add_column :assignments, :submissions_count, :integer, default: 0, null: false unless column_exists?(:assignments, :submissions_count)
    add_column :discussions, :discussion_posts_count, :integer, default: 0, null: false unless column_exists?(:discussions, :discussion_posts_count)
    add_column :quizzes, :quiz_attempts_count, :integer, default: 0, null: false unless column_exists?(:quizzes, :quiz_attempts_count)
    add_column :question_banks, :questions_count, :integer, default: 0, null: false unless column_exists?(:question_banks, :questions_count)
    add_column :message_threads, :messages_count, :integer, default: 0, null: false unless column_exists?(:message_threads, :messages_count)

    execute <<~SQL
      UPDATE courses
      SET assignments_count = (
        SELECT COUNT(*)
        FROM assignments
        WHERE assignments.course_id = courses.id
      )
    SQL

    execute <<~SQL
      UPDATE courses
      SET enrollments_count = (
        SELECT COUNT(*)
        FROM enrollments
        INNER JOIN sections ON sections.id = enrollments.section_id
        WHERE sections.course_id = courses.id
      )
    SQL

    execute <<~SQL
      UPDATE assignments
      SET submissions_count = (
        SELECT COUNT(*)
        FROM submissions
        WHERE submissions.assignment_id = assignments.id
      )
    SQL

    execute <<~SQL
      UPDATE discussions
      SET discussion_posts_count = (
        SELECT COUNT(*)
        FROM discussion_posts
        WHERE discussion_posts.discussion_id = discussions.id
      )
    SQL

    execute <<~SQL
      UPDATE quizzes
      SET quiz_attempts_count = (
        SELECT COUNT(*)
        FROM quiz_attempts
        WHERE quiz_attempts.quiz_id = quizzes.id
      )
    SQL

    execute <<~SQL
      UPDATE question_banks
      SET questions_count = (
        SELECT COUNT(*)
        FROM questions
        WHERE questions.question_bank_id = question_banks.id
      )
    SQL

    execute <<~SQL
      UPDATE message_threads
      SET messages_count = (
        SELECT COUNT(*)
        FROM messages
        WHERE messages.message_thread_id = message_threads.id
      )
    SQL
  end

  def down
    remove_column :courses, :assignments_count if column_exists?(:courses, :assignments_count)
    remove_column :courses, :enrollments_count if column_exists?(:courses, :enrollments_count)
    remove_column :assignments, :submissions_count if column_exists?(:assignments, :submissions_count)
    remove_column :discussions, :discussion_posts_count if column_exists?(:discussions, :discussion_posts_count)
    remove_column :quizzes, :quiz_attempts_count if column_exists?(:quizzes, :quiz_attempts_count)
    remove_column :question_banks, :questions_count if column_exists?(:question_banks, :questions_count)
    remove_column :message_threads, :messages_count if column_exists?(:message_threads, :messages_count)
  end
end
