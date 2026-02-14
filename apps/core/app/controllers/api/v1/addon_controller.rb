module Api
  module V1
    class AddonController < ApplicationController
      VALID_LINKABLE_TYPES = %w[LessonVersion UnitVersion CourseModule Assignment].freeze

      def unit_plans
        authorize :addon
        plans = policy_scope(UnitPlan).order(updated_at: :desc).limit(50)
        render json: plans.map { |p|
          {
            id: p.id,
            title: p.title,
            status: p.status,
            updated_at: p.updated_at
          }
        }
      end

      def lessons
        authorize :addon
        unit_plan = UnitPlan.find(params[:id])
        lessons = unit_plan.lesson_plans.order(:position)
        render json: lessons.map { |l|
          {
            id: l.id,
            title: l.title,
            position: l.position
          }
        }
      end

      def attach
        authorize :addon
        unless VALID_LINKABLE_TYPES.include?(params[:linkable_type])
          render json: { error: "Invalid linkable_type" }, status: :unprocessable_entity
          return
        end
        linkable = params[:linkable_type].constantize.find(params[:linkable_id])
        resource_link = ResourceLink.create!(
          tenant: Current.tenant,
          linkable: linkable,
          url: params[:drive_file_url],
          title: params[:drive_file_title],
          provider: "google_drive",
          drive_file_id: params[:drive_file_id],
          mime_type: params[:drive_mime_type]
        )
        render json: resource_link, status: :created
      end

      def me
        authorize :addon
        render json: {
          id: Current.user.id,
          name: "#{Current.user.first_name} #{Current.user.last_name}",
          email: Current.user.email,
          tenant_name: Current.tenant.name
        }
      end
    end
  end
end
