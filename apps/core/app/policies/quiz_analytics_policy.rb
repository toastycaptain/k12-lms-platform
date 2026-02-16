# frozen_string_literal: true

class QuizAnalyticsPolicy < QuizPolicy
  alias_method :show?, :results?
end
