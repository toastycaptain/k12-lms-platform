module Api
  module V1
    module Ib
      class CollaborationTasksController < BaseController
        before_action :set_task, only: :update

        def index
          authorize IbCollaborationTask
          tasks = policy_scope(IbCollaborationTask).includes(:assigned_to).order(updated_at: :desc, id: :desc)
          tasks = tasks.where(curriculum_document_id: params[:curriculum_document_id]) if params[:curriculum_document_id].present?
          render json: tasks.limit(25).map { |task| serialize(task) }
        end

        def create
          authorize IbCollaborationTask
          render json: service.upsert_task!(task_params), status: :created
        end

        def update
          authorize @task
          render json: service.upsert_task!(task_params.merge(id: params[:id]))
        end

        private

        def set_task
          @task = policy_scope(IbCollaborationTask).find(params[:id])
        end

        def service
          @service ||= ::Ib::Collaboration::WorkbenchService.new(tenant: Current.tenant, school: current_school_scope, actor: Current.user)
        end

        def task_params
          params.fetch(:ib_collaboration_task, params).permit(:curriculum_document_id, :assigned_to_id, :status, :priority, :title, :detail, :due_on, :section_key, mention_payload: {}, metadata: {})
        end

        def serialize(task)
          {
            id: task.id,
            curriculum_document_id: task.curriculum_document_id,
            status: task.status,
            priority: task.priority,
            title: task.title,
            detail: task.detail,
            due_on: task.due_on&.iso8601,
            section_key: task.section_key,
            mention_payload: task.mention_payload,
            assigned_to_label: task.assigned_to&.full_name || task.assigned_to&.email,
            updated_at: task.updated_at.utc.iso8601
          }
        end
      end
    end
  end
end
