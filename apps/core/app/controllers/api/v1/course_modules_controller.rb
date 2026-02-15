module Api
  module V1
    class CourseModulesController < ApplicationController
      before_action :set_course, only: [ :index, :create ]
      before_action :set_course_module, only: [ :show, :update, :destroy, :publish, :archive, :reorder_items, :reorder ]

      def index
        modules = policy_scope(CourseModule).where(course: @course).ordered
        render json: modules
      end

      def show
        authorize @course_module
        render json: @course_module
      end

      def create
        @course_module = @course.course_modules.build(course_module_params)
        @course_module.tenant = Current.tenant
        authorize @course_module
        if @course_module.save
          render json: @course_module, status: :created
        else
          render json: { errors: @course_module.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        authorize @course_module
        if @course_module.update(course_module_params)
          render json: @course_module
        else
          render json: { errors: @course_module.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        authorize @course_module
        @course_module.destroy!
        head :no_content
      end

      def publish
        authorize @course_module
        CourseModule.transaction do
          @course_module.publish!
          @course_module.module_items.includes(:itemable).each do |item|
            next unless item.itemable.respond_to?(:publish!) && item.itemable.respond_to?(:status)
            next unless item.itemable.status == "draft"

            item.itemable.publish!
          end
        end
        render json: @course_module.reload
      rescue ActiveRecord::RecordInvalid
        render json: { error: "Cannot publish from current status" }, status: :unprocessable_content
      end

      def archive
        authorize @course_module
        @course_module.archive!
        render json: @course_module
      rescue ActiveRecord::RecordInvalid
        render json: { error: "Cannot archive from current status" }, status: :unprocessable_content
      end

      def reorder_items
        authorize @course_module
        item_ids = params[:item_ids] || []
        item_ids.each_with_index do |id, index|
          @course_module.module_items.where(id: id).update_all(position: index) # rubocop:disable Rails/SkipsModelValidations
        end
        render json: @course_module.module_items.ordered
      end

      def reorder
        reorder_items
      end

      private

      def set_course
        @course = Course.find(params[:course_id])
      end

      def set_course_module
        @course_module = CourseModule.find(params[:id])
      end

      def course_module_params
        params.permit(:title, :description, :position, :unlock_at)
      end
    end
  end
end
