module Api
  module V1
    class CourseModulesController < ApplicationController
      before_action :set_course, only: [ :index, :create ]
      before_action :set_course_module, only: [ :show, :update, :destroy, :publish, :archive, :reorder_items ]

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
        @course_module.publish!
        render json: @course_module
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
        return render json: @course_module.module_items.ordered if item_ids.empty?

        # Build a single CASE-based UPDATE instead of N individual updates
        case_sql = "CASE id "
        item_ids.each_with_index do |id, index|
          case_sql += "WHEN #{ActiveRecord::Base.connection.quote(id)} THEN #{index} "
        end
        case_sql += "END"

        @course_module.module_items.where(id: item_ids).update_all("position = #{case_sql}") # rubocop:disable Rails/SkipsModelValidations
        render json: @course_module.module_items.ordered
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
