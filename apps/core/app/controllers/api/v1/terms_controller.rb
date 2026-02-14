module Api
  module V1
    class TermsController < ApplicationController
      before_action :set_term, only: [ :show, :update, :destroy ]

      def index
        @terms = policy_scope(Term)
        @terms = @terms.where(academic_year_id: params[:academic_year_id]) if params[:academic_year_id]
        render json: @terms
      end

      def show
        render json: @term
      end

      def create
        @term = Term.new(term_params)
        authorize @term

        if @term.save
          render json: @term, status: :created
        else
          render json: { errors: @term.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @term.update(term_params)
          render json: @term
        else
          render json: { errors: @term.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @term.destroy!
        head :no_content
      end

      private

      def set_term
        @term = Term.find(params[:id])
        authorize @term
      end

      def term_params
        params.require(:term).permit(:academic_year_id, :name, :start_date, :end_date)
      end
    end
  end
end
