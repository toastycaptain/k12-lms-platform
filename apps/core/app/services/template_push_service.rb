class TemplatePushService
  attr_reader :source_template, :target_tenant, :actor

  def initialize(source_template, target_tenant, actor: nil)
    @source_template = source_template
    @target_tenant = target_tenant
    @actor = actor || source_template.created_by
    @source_snapshot = build_snapshot(source_template)
  end

  def call
    previous_tenant = Current.tenant
    Current.tenant = target_tenant

    template = Template.create!(
      tenant: target_tenant,
      created_by: resolved_creator,
      name: source_snapshot[:name],
      subject: source_snapshot[:subject],
      grade_level: source_snapshot[:grade_level],
      description: source_snapshot[:description],
      status: "draft"
    )

    source_snapshot[:versions].each do |version_data|
      target_version = template.create_version!(
        title: version_data[:title],
        description: version_data[:description],
        essential_questions: version_data[:essential_questions],
        enduring_understandings: version_data[:enduring_understandings],
        suggested_duration_weeks: version_data[:suggested_duration_weeks]
      )
      attach_standards(target_version, version_data[:standards])
    end

    apply_source_status(template)
    template
  ensure
    Current.tenant = previous_tenant
  end

  private

  attr_reader :source_snapshot

  def build_snapshot(template)
    {
      name: template.name,
      subject: template.subject,
      grade_level: template.grade_level,
      description: template.description,
      status: template.status,
      versions: template.template_versions.includes(:standards).order(:version_number).map do |version|
        {
          version_number: version.version_number,
          title: version.title,
          description: version.description,
          essential_questions: version.essential_questions || [],
          enduring_understandings: version.enduring_understandings || [],
          suggested_duration_weeks: version.suggested_duration_weeks,
          standards: version.standards.map { |standard| { code: standard.code, grade_band: standard.grade_band } }
        }
      end
    }
  end

  def attach_standards(template_version, standard_snapshots)
    standard_ids = standard_snapshots.filter_map do |snapshot|
      Standard.find_by(code: snapshot[:code], grade_band: snapshot[:grade_band]) ||
        Standard.find_by(code: snapshot[:code])
    end.map(&:id).uniq

    return if standard_ids.empty?

    now = Time.current
    records = standard_ids.map do |standard_id|
      {
        tenant_id: target_tenant.id,
        template_version_id: template_version.id,
        standard_id: standard_id,
        created_at: now,
        updated_at: now
      }
    end
    TemplateVersionStandard.insert_all(records) # rubocop:disable Rails/SkipsModelValidations
  end

  def apply_source_status(template)
    case source_snapshot[:status]
    when "published"
      template.publish!
    when "archived"
      template.publish!
      template.archive!
    end
  end

  def resolved_creator
    User.unscoped.find_by(id: actor&.id, tenant_id: target_tenant.id) ||
      User.unscoped.where(tenant_id: target_tenant.id).order(:id).first ||
      actor ||
      source_template.created_by
  end
end
