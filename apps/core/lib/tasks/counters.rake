namespace :counters do
  desc "Reset all performance counter caches"
  task reset: :environment do
    Course.find_each do |course|
      Course.reset_counters(course.id, :assignments)
      Course.where(id: course.id).update_all( # rubocop:disable Rails/SkipsModelValidations
        enrollments_count: Enrollment.joins(:section).where(sections: { course_id: course.id }).count
      )
    end

    Assignment.find_each { |assignment| Assignment.reset_counters(assignment.id, :submissions) }
    Discussion.find_each { |discussion| Discussion.reset_counters(discussion.id, :discussion_posts) }
    Quiz.find_each { |quiz| Quiz.reset_counters(quiz.id, :quiz_attempts) }
    QuestionBank.find_each { |question_bank| QuestionBank.reset_counters(question_bank.id, :questions) }
    MessageThread.find_each { |thread| MessageThread.reset_counters(thread.id, :messages) }
  end
end
