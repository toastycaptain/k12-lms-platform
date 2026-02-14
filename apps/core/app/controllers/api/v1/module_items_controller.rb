module Api
  module V1
    class ModuleItemsController < ApplicationController
      before_action :set_course_module, only: [ :index, :create ]
      before_action :set_module_item, only: [ :show, :update, :destroy ]

      def index
        items = policy_scope(ModuleItem).where(course_module: @course_module).ordered
        render json: items
      end

      def show
        authorize @module_item
        render json: @module_item
      end

      def create
        @module_item = @course_module.module_items.build(module_item_params)
        @module_item.tenant = Current.tenant
        authorize @module_item
        if @module_item.save
          render json: @module_item, status: :created
        else
          render json: { errors: @module_item.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @module_item
        if @module_item.update(module_item_params)
          render json: @module_item
        else
          render json: { errors: @module_item.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @module_item
        @module_item.destroy!
        head :no_content
      end

      private

      def set_course_module
        @course_module = CourseModule.find(params[:module_id])
      end

      def set_module_item
        @module_item = ModuleItem.find(params[:id])
      end

      def module_item_params
        params.permit(:title, :item_type, :itemable_type, :itemable_id, :position)
      end
    end
  end
end
