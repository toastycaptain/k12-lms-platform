module Api
  module V1
    class ModuleItemCompletionsController < ApplicationController
      before_action :set_module_item, only: [ :create, :destroy ]
      before_action :set_course_module, only: [ :progress ]

      def create
        completion = ModuleItemCompletion.find_or_initialize_by(
          module_item: @module_item,
          user: Current.user
        )
        completion.tenant = Current.tenant
        completion.completed_at ||= Time.current
        authorize completion

        if completion.save
          render json: completion, status: :created
        else
          render json: { errors: completion.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        completion = ModuleItemCompletion.find_by(module_item: @module_item, user: Current.user)
        completion ||= ModuleItemCompletion.new(module_item: @module_item, user: Current.user, tenant: Current.tenant)
        authorize completion

        completion.destroy if completion.persisted?
        head :no_content
      end

      def progress
        authorize ModuleItemCompletion.new(module_item: @course_module.module_items.first || @course_module.module_items.build), :progress?

        items = @course_module.module_items
        item_ids = items.pluck(:id)
        scoped_completions = policy_scope(ModuleItemCompletion).where(module_item_id: item_ids)
        completions_by_user = scoped_completions.group(:user_id).count

        current_user_completions = scoped_completions.where(user_id: Current.user.id)
        current_user_completed = current_user_completions.count

        render json: {
          course_module_id: @course_module.id,
          total_items: item_ids.length,
          current_user_completed_count: current_user_completed,
          current_user_completed_item_ids: current_user_completions.pluck(:module_item_id),
          completion_by_user: completions_by_user.map { |user_id, completed_count|
            {
              user_id: user_id,
              completed_count: completed_count
            }
          }
        }
      end

      private

      def set_module_item
        @module_item = ModuleItem.find(params[:module_item_id] || params[:id])
      end

      def set_course_module
        @course_module = CourseModule.find(params[:id])
      end
    end
  end
end
