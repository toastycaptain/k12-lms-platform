require "rails_helper"

RSpec.describe "Counter caches", type: :model do
  let!(:tenant) { create(:tenant) }
  let!(:academic_year) { create(:academic_year, tenant: tenant) }
  let!(:course) { create(:course, tenant: tenant, academic_year: academic_year) }
  let!(:teacher) { create(:user, tenant: tenant) }

  before { Current.tenant = tenant }
  after { Current.tenant = nil }

  it "increments assignments_count on course" do
    expect do
      create(:assignment, tenant: tenant, course: course, created_by: teacher)
    end.to change { course.reload.assignments_count }.by(1)
  end

  it "increments submissions_count on assignment" do
    assignment = create(:assignment, tenant: tenant, course: course, created_by: teacher)
    student = create(:user, tenant: tenant)

    expect do
      create(:submission, tenant: tenant, assignment: assignment, user: student)
    end.to change { assignment.reload.submissions_count }.by(1)
  end

  it "increments discussion_posts_count on discussion" do
    discussion = create(:discussion, tenant: tenant, course: course, created_by: teacher)

    expect do
      create(:discussion_post, tenant: tenant, discussion: discussion, created_by: teacher)
    end.to change { discussion.reload.discussion_posts_count }.by(1)
  end

  it "increments questions_count on question bank" do
    question_bank = create(:question_bank, tenant: tenant, created_by: teacher)

    expect do
      create(:question, tenant: tenant, question_bank: question_bank, created_by: teacher)
    end.to change { question_bank.reload.questions_count }.by(1)
  end

  it "increments quiz_attempts_count on quiz" do
    quiz = create(:quiz, tenant: tenant, course: course, created_by: teacher, status: "published")
    student = create(:user, tenant: tenant)

    expect do
      create(:quiz_attempt, tenant: tenant, quiz: quiz, user: student)
    end.to change { quiz.reload.quiz_attempts_count }.by(1)
  end

  it "increments messages_count on message thread" do
    message_thread = create(:message_thread, tenant: tenant, course: course)

    expect do
      create(:message, tenant: tenant, message_thread: message_thread, sender: teacher)
    end.to change { message_thread.reload.messages_count }.by(1)
  end
end
