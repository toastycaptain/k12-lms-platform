module Api
  module V1
    module Ai
      class AiGenerationsController < ApplicationController
        def generate_unit
          authorize :ai_generation, :generate_unit?
          task_policy = AiTaskPolicy.find_by(task_type: "unit_generation", enabled: true)
          unless task_policy&.allowed_for?(Current.user)
            render json: { error: "AI task not available" }, status: :forbidden
            return
          end

          invocation = create_invocation!(task_policy, "unit_generation", unit_generation_params)
          AiUnitGenerationJob.perform_later(invocation.id, unit_generation_params.to_h)

          render json: { invocation_id: invocation.id, status: "pending" }, status: :accepted
        end

        def generate_lesson
          authorize :ai_generation, :generate_lesson?
          task_policy = AiTaskPolicy.find_by(task_type: "lesson_generation", enabled: true)
          unless task_policy&.allowed_for?(Current.user)
            render json: { error: "AI task not available" }, status: :forbidden
            return
          end

          invocation = create_invocation!(task_policy, "lesson_generation", lesson_generation_params)
          AiLessonGenerationJob.perform_later(invocation.id, lesson_generation_params.to_h)

          render json: { invocation_id: invocation.id, status: "pending" }, status: :accepted
        end

        def differentiate
          authorize :ai_generation, :differentiate?
          task_policy = AiTaskPolicy.find_by(task_type: "differentiation", enabled: true)
          unless task_policy&.allowed_for?(Current.user)
            render json: { error: "AI task not available" }, status: :forbidden
            return
          end

          invocation = create_invocation!(task_policy, "differentiation", differentiation_params)
          AiDifferentiationJob.perform_later(invocation.id, differentiation_params.to_h)

          render json: { invocation_id: invocation.id, status: "pending" }, status: :accepted
        end

        def generate_assessment
          authorize :ai_generation, :generate_assessment?
          task_policy = AiTaskPolicy.find_by(task_type: "assessment_generation", enabled: true)
          unless task_policy&.allowed_for?(Current.user)
            render json: { error: "AI task not available" }, status: :forbidden
            return
          end

          invocation = create_invocation!(task_policy, "assessment_generation", assessment_params)
          AiAssessmentGenerationJob.perform_later(invocation.id, assessment_params.to_h)

          render json: { invocation_id: invocation.id, status: "pending" }, status: :accepted
        end

        def rewrite
          authorize :ai_generation, :rewrite?
          task_policy = AiTaskPolicy.find_by(task_type: "rewrite", enabled: true)
          unless task_policy&.allowed_for?(Current.user)
            render json: { error: "AI task not available" }, status: :forbidden
            return
          end

          invocation = create_invocation!(task_policy, "rewrite", rewrite_params)
          AiRewriteJob.perform_later(invocation.id, rewrite_params.to_h)

          render json: { invocation_id: invocation.id, status: "pending" }, status: :accepted
        end

        def result
          authorize :ai_generation, :result?
          invocation = AiInvocation.find(params[:id])
          cached = Rails.cache.read("ai_result_#{invocation.id}")

          render json: {
            status: invocation.status,
            content: cached,
            error_message: invocation.error_message
          }
        end

        private

        def create_invocation!(task_policy, task_type, params_hash)
          template = AiTemplate.active.for_task_type(task_type).first

          AiInvocation.create!(
            tenant: Current.tenant,
            user: Current.user,
            ai_provider_config: task_policy.ai_provider_config,
            ai_task_policy: task_policy,
            ai_template: template,
            task_type: task_type,
            provider_name: task_policy.ai_provider_config.provider_name,
            model: task_policy.effective_model,
            status: "pending",
            input_hash: Digest::SHA256.hexdigest(params_hash.to_json),
            context: params_hash.slice(:subject, :grade_level, :topic).to_h
          )
        end

        def unit_generation_params
          params.permit(:subject, :topic, :grade_level, :num_lessons, :additional_context, standards: [])
        end

        def lesson_generation_params
          params.permit(:unit_plan_id, :subject, :topic, :grade_level, :objectives, :duration_minutes,
                        :additional_context, standards: [])
        end

        def differentiation_params
          params.permit(:content, :differentiation_type, :grade_level, :subject, :additional_context)
        end

        def assessment_params
          params.permit(:topic, :grade_level, :num_questions, :difficulty, :additional_context,
                        question_types: [], standards: [])
        end

        def rewrite_params
          params.permit(:content, :instruction, :grade_level, :additional_context)
        end
      end
    end
  end
end
