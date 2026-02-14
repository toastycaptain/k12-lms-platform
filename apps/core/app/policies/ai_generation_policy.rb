class AiGenerationPolicy < ApplicationPolicy
  def generate_unit?
    true # actual check happens via AiTaskPolicy in controller
  end

  def generate_lesson?
    true
  end

  def differentiate?
    true
  end

  def generate_assessment?
    true
  end

  def rewrite?
    true
  end

  def result?
    true
  end
end
