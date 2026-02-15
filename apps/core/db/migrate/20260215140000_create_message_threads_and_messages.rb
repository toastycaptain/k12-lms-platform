class CreateMessageThreadsAndMessages < ActiveRecord::Migration[8.1]
  def change
    unless table_exists?(:message_threads)
      create_table :message_threads do |t|
        t.references :tenant, null: false, foreign_key: true
        t.references :course, foreign_key: true
        t.string :subject, null: false
        t.string :thread_type, null: false, default: "direct"
        t.timestamps
      end

      add_index :message_threads, [ :tenant_id, :thread_type ]
    end

    unless table_exists?(:message_thread_participants)
      create_table :message_thread_participants do |t|
        t.references :tenant, null: false, foreign_key: true
        t.references :message_thread, null: false, foreign_key: true
        t.references :user, null: false, foreign_key: true
        t.datetime :last_read_at
        t.timestamps
      end

      add_index :message_thread_participants,
        [ :message_thread_id, :user_id ],
        unique: true,
        name: "idx_thread_participants_unique"
    end

    unless table_exists?(:messages)
      create_table :messages do |t|
        t.references :tenant, null: false, foreign_key: true
        t.references :message_thread, null: false, foreign_key: true
        t.references :sender, null: false, foreign_key: { to_table: :users }
        t.text :body, null: false
        t.timestamps
      end

      add_index :messages, [ :message_thread_id, :created_at ]
    end
  end
end
