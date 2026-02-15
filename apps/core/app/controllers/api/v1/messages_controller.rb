module Api
  module V1
    class MessagesController < ApplicationController
      before_action :set_message_thread

      def index
        authorize @message_thread, :show?

        messages = policy_scope(Message).where(message_thread: @message_thread).includes(sender: :roles).order(created_at: :asc)
        messages = paginate(messages)
        mark_thread_read!

        render json: messages
      end

      def create
        message = @message_thread.messages.build(message_params)
        message.tenant = Current.tenant
        message.sender = Current.user
        authorize message

        if message.save
          mark_thread_read!
          render json: message, status: :created
        else
          render json: { errors: message.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def set_message_thread
        thread_id = params[:message_thread_id] || params[:thread_id]
        @message_thread = MessageThread.find(thread_id)
      end

      def message_params
        params.permit(:body)
      end

      def mark_thread_read!
        participant = @message_thread.message_thread_participants.find_by(user: Current.user)
        participant&.mark_read!
      end
    end
  end
end
