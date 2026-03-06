namespace :ib do
  desc "Backfill legacy IB unit plans into curriculum documents"
  task backfill_legacy_plans: :environment do
    tenant = Tenant.find(ENV.fetch("TENANT_ID"))
    actor = User.find(ENV.fetch("ACTOR_ID"))
    result = Ib::Migration::LegacyPlanBackfillService.new(tenant: tenant, actor: actor).run!

    puts({
      created_document_ids: result.created_document_ids,
      skipped_legacy_ids: result.skipped_legacy_ids,
      errors: result.errors,
    }.to_json)
  end
end
