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

  namespace :pilot do
    desc "Apply the sanctioned IB pilot baseline bundle for a tenant and school"
    task apply_baseline: :environment do
      tenant = Tenant.find(ENV.fetch("TENANT_ID"))
      school = School.find(ENV.fetch("SCHOOL_ID"))
      actor = User.find(ENV.fetch("ACTOR_ID"))

      result = Ib::Support::PilotBaselineService.new(
        tenant: tenant,
        school: school,
        actor: actor
      ).apply!

      puts result.to_json
    end

    desc "Recompute pilot setup/readiness status for a tenant and school"
    task recompute: :environment do
      tenant = Tenant.find(ENV.fetch("TENANT_ID"))
      school = School.find(ENV.fetch("SCHOOL_ID"))
      actor = User.find(ENV.fetch("ACTOR_ID"))
      programme = ENV.fetch("PROGRAMME", "Mixed")

      result = Ib::Support::PilotSetupMutationService.new(
        tenant: tenant,
        school: school,
        actor: actor,
        programme: programme
      ).validate!

      puts result.to_json
    end
  end

  namespace :ops do
    desc "Replay an IB operational failure by type and id"
    task replay: :environment do
      tenant = Tenant.find(ENV.fetch("TENANT_ID"))
      school = School.find(ENV.fetch("SCHOOL_ID"))
      actor = User.find(ENV.fetch("ACTOR_ID"))
      operation_type = ENV.fetch("OPERATION_TYPE")
      operation_id = ENV.fetch("OPERATION_ID")

      result = Ib::Support::JobOperationsService.new(
        tenant: tenant,
        school: school,
        actor: actor
      ).replay!(operation_type: operation_type, id: operation_id)

      puts({ replayed: true, result: result }.to_json)
    end
  end
end
