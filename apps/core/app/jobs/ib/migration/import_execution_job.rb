module Ib
  module Migration
    class ImportExecutionJob < ApplicationJob
      queue_as :ib_imports

      def perform(batch_id, actor_id = nil)
        batch = IbImportBatch.find(batch_id)
        actor = User.find_by(id: actor_id) || batch.executed_by || batch.initiated_by
        ExecutionService.new(batch: batch, actor: actor).run!
      end
    end
  end
end
