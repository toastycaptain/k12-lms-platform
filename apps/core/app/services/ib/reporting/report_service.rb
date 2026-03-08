module Ib
  module Reporting
    class ReportService
      REPORT_FAMILIES = %w[pyp_narrative myp_snapshot dp_progress conference_packet].freeze
      REPORT_CONTRACT_VERSION = "phase10.v1".freeze
      DEFAULT_GUARDIAN_LOCALES = %w[en es fr].freeze

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def generate!(report_family:, student: nil, audience: "internal", title: nil, metadata: {})
        family = normalize_family(report_family)
        payload = build_payload(report_family: family, student: student, audience: audience)
        proofing = proofing_summary(payload, audience: audience)
        template = matching_template(report_family: family, audience: audience, programme: payload[:programme])
        cycle = active_cycle_for(payload[:programme])

        report = IbReport.find_or_initialize_by(
          tenant: user.tenant,
          school: school,
          academic_year: current_academic_year,
          student: student,
          report_family: family,
          audience: audience
        )

        version_number = report.versions.maximum(:version_number).to_i + 1
        report.assign_attributes(
          programme: payload[:programme],
          title: title.presence || payload[:title],
          summary: payload[:summary],
          source_refs: payload[:source_refs],
          proofing_summary: proofing,
          metadata: report.metadata.merge(
            metadata.to_h.deep_stringify_keys
          ).merge(
            "contract_version" => REPORT_CONTRACT_VERSION,
            "localization" => payload[:localization],
            "conference_packet" => payload[:conference_packet],
            "render_contract" => payload[:render_contract]
          ),
          author: user,
          ib_report_cycle: cycle || report.ib_report_cycle,
          ib_report_template: template || report.ib_report_template,
          status: "in_review",
          last_rendered_at: Time.current
        )
        report.save!

        version = report.versions.create!(
          tenant: user.tenant,
          version_number: version_number,
          status: "rendered",
          template_key: template_key_for(family, audience),
          content_payload: payload,
          render_payload: render_payload(payload, report: report, version_number: version_number),
          proofing_summary: proofing,
          metadata: {
            "generated_by_id" => user.id,
            "family" => family,
            "audience" => audience,
            "template_name" => template&.name,
            "cycle_key" => cycle&.cycle_key,
            "contract_version" => REPORT_CONTRACT_VERSION
          }.compact
        )

        Ib::Support::ActivityEventService.record!(
          tenant: user.tenant,
          user: user,
          school: school,
          event_name: "ib.report.generated",
          event_family: "reporting",
          surface: "reports",
          programme: payload[:programme],
          entity_ref: "IbReport:#{report.id}",
          metadata: {
            version_id: version.id,
            report_family: family,
            audience: audience,
            locales: Array(payload.dig(:localization, :available_locales))
          }
        )

        report
      end

      def transition!(report:, params:)
        action = params[:action].to_s
        case action
        when "sign_off"
          sign_off!(report)
        when "release"
          release!(report)
        when "deliver"
          deliver!(
            report,
            recipient: User.find_by(id: params[:recipient_id]),
            channel: params[:channel].presence || "web",
            locale: params[:locale].presence || "en",
            audience_role: params[:audience_role].presence || report.audience
          )
        when "mark_read"
          mark_delivery_state!(report, delivery_id: params[:delivery_id], target_state: "read")
        when "acknowledge"
          mark_delivery_state!(report, delivery_id: params[:delivery_id], target_state: "acknowledged")
        else
          report.update!(
            title: params[:title].presence || report.title,
            summary: params[:summary].presence || report.summary,
            metadata: report.metadata.merge(params[:metadata].to_h.deep_stringify_keys)
          )
        end
        report.reload
      end

      def serialize(report)
        {
          id: report.id,
          programme: report.programme,
          report_family: report.report_family,
          audience: report.audience,
          status: report.status,
          title: report.title,
          summary: report.summary,
          source_refs: report.source_refs,
          proofing_summary: report.proofing_summary,
          released_at: report.released_at&.utc&.iso8601,
          last_rendered_at: report.last_rendered_at&.utc&.iso8601,
          report_contract: report_contract(report),
          localization: localization_payload(report),
          release_workflow: release_workflow(report),
          archive_entry: archive_entry(report),
          analytics: analytics_payload(report),
          viewer_permissions: viewer_permissions(report),
          conference_packet: conference_packet_payload(report),
          current_version: serialize_version(report.current_version),
          versions: report.versions.order(version_number: :desc).limit(5).map { |version| serialize_version(version) },
          deliveries: report.deliveries.order(created_at: :desc).limit(10).map { |delivery| serialize_delivery(delivery) }
        }
      end

      private

      attr_reader :user, :school

      def normalize_family(value)
        family = value.to_s
        return family if REPORT_FAMILIES.include?(family)

        "conference_packet"
      end

      def sign_off!(report)
        version = report.current_version
        version&.update!(status: "signed_off", signed_off_by: user, signed_off_at: Time.current)
        report.update!(status: "signed_off")
        record_event(report, "ib.report.signed_off")
      end

      def release!(report)
        report.update!(status: "released", released_at: Time.current)
        record_event(report, "ib.report.released")
      end

      def deliver!(report, recipient:, channel:, locale:, audience_role:)
        deliveries = delivery_targets(report, recipient, audience_role).map do |target|
          delivery = report.deliveries.where(
            recipient: target,
            audience_role: audience_role,
            channel: channel
          ).order(created_at: :desc, id: :desc).first_or_initialize

          artifact_url = artifact_url_for(report, channel: channel)
          archive_key = archive_key_for(report, locale: locale, audience_role: audience_role)
          delivery.assign_attributes(
            tenant: user.tenant,
            school: school,
            ib_report_version: report.current_version,
            locale: locale,
            status: "delivered",
            delivered_at: Time.current,
            metadata: delivery.metadata.to_h.merge(
              "delivered_by_id" => user.id,
              "artifact_url" => artifact_url,
              "archive_key" => archive_key,
              "feedback_window" => "7 days",
              "delivery_channel" => channel,
              "localization_state" => localization_state_for(report, locale: locale)
            )
          )
          delivery.save!
          sync_receipt!(report, delivery, locale: locale)
          delivery
        end

        record_event(
          report,
          "ib.report.delivered",
          metadata: {
            audience_role: audience_role,
            channel: channel,
            delivery_ids: deliveries.map(&:id)
          }
        )
        deliveries
      end

      def mark_delivery_state!(report, delivery_id:, target_state:)
        delivery =
          if delivery_id.present?
            report.deliveries.find(delivery_id)
          else
            report.deliveries.where(recipient: user).order(created_at: :desc, id: :desc).first ||
              report.deliveries.order(created_at: :desc, id: :desc).first
          end
        raise ActiveRecord::RecordNotFound, "No delivery found for report #{report.id}" if delivery.nil?

        attrs =
          if target_state == "read"
            { status: "read", read_at: Time.current }
          else
            { status: "acknowledged", acknowledged_at: Time.current }
          end
        delivery.update!(attrs)

        receipt = IbDeliveryReceipt.find_by(
          tenant: user.tenant,
          user: delivery.recipient,
          deliverable_type: "IbReport",
          deliverable_id: report.id,
          audience_role: delivery.audience_role
        )
        receipt&.update!(attrs.slice(:read_at, :acknowledged_at).merge(state: attrs[:status]))
        record_event(
          report,
          target_state == "read" ? "ib.report.read" : "ib.report.acknowledged",
          metadata: { delivery_id: delivery.id, audience_role: delivery.audience_role }
        )
      end

      def build_payload(report_family:, student:, audience:)
        case report_family
        when "pyp_narrative"
          build_pyp_payload(student: student, audience: audience)
        when "myp_snapshot"
          build_myp_payload(student: student, audience: audience)
        when "dp_progress"
          build_dp_payload(student: student, audience: audience)
        else
          build_conference_payload(student: student, audience: audience)
        end
      end

      def build_pyp_payload(student:, audience:)
        stories = scoped_stories(student, programme: "PYP").limit(4)
        evidence = scoped_evidence(student, programme: "PYP").limit(6)
        profile_signals = evidence.flat_map { |item| Array(item.metadata["learner_profile"]) }.tally
        atl_signals = evidence.flat_map { |item| Array(item.metadata["atl_tags"]) }.tally
        sections = [
          section("Learning story", stories.map { |story| { title: story.title, detail: story.summary, href: Ib::RouteBuilder.href_for(story) } }),
          section("Learner profile", profile_signals.map { |key, count| { title: key, detail: "#{count} evidence signal(s)" } }),
          section("ATL growth", atl_signals.map { |key, count| { title: key, detail: "#{count} evidence signal(s)" } }),
          section("Family support", stories.filter_map { |story| story.support_prompt.present? ? { title: story.title, detail: story.support_prompt } : nil })
        ]
        base_payload(
          title: "#{student_label(student)} PYP narrative report",
          programme: "PYP",
          audience: audience,
          summary: "#{stories.count} stories and #{evidence.count} evidence items synthesized for a narrative report.",
          sections: sections,
          source_refs: refs_for(stories) + refs_for(evidence),
          family_prompts: stories.filter_map { |story| story.support_prompt.presence },
          conference_prompts: conference_questions(student),
          report_theme: "pyp_river"
        )
      end

      def build_myp_payload(student:, audience:)
        records = scoped_records(student, programme: "MYP").where(record_family: %w[myp_project myp_service]).limit(8)
        evidence = scoped_evidence(student, programme: "MYP").limit(6)
        criteria = records.flat_map { |record| Array(record.metadata["criteria"]) }.tally
        atl = evidence.flat_map { |item| Array(item.metadata["atl_tags"]) }.tally
        interdisciplinary = records.flat_map { |record| Array(record.metadata["interdisciplinary_links"]) }.tally
        sections = [
          section("Criteria snapshot", criteria.map { |key, count| { title: key, detail: "#{count} milestone(s)" } }),
          section("ATL snapshot", atl.map { |key, count| { title: key, detail: "#{count} evidence signal(s)" } }),
          section("Interdisciplinary summary", interdisciplinary.map { |key, count| { title: key, detail: "#{count} linked task(s)" } }),
          section("Project summary", records.map { |record| { title: record.title, detail: record.next_action || record.summary, href: Ib::RouteBuilder.href_for(record) } })
        ]
        base_payload(
          title: "#{student_label(student)} MYP snapshot",
          programme: "MYP",
          audience: audience,
          summary: "#{records.count} milestone(s) and #{evidence.count} evidence item(s) rolled into a term snapshot.",
          sections: sections,
          source_refs: refs_for(records) + refs_for(evidence),
          family_prompts: evidence.filter_map { |item| item.summary.presence }.first(3),
          conference_prompts: conference_questions(student),
          report_theme: "myp_grid"
        )
      end

      def build_dp_payload(student:, audience:)
        records = scoped_records(student, programme: "DP").where(record_family: %w[dp_ia dp_ee dp_tok dp_cas]).limit(10)
        evidence = scoped_evidence(student, programme: "DP").limit(4)
        sections = [
          section("IA progress", records.select { |record| record.record_family == "dp_ia" }.map { |record| { title: record.title, detail: record.next_action || record.summary, href: Ib::RouteBuilder.href_for(record) } }),
          section("EE / TOK / CAS", records.select { |record| record.record_family.in?(%w[dp_ee dp_tok dp_cas]) }.map { |record| { title: record.title, detail: record.next_action || record.summary, href: Ib::RouteBuilder.href_for(record) } }),
          section("Risk watch", records.select { |record| record.risk_level.in?(%w[watch risk]) }.map { |record| { title: record.title, detail: "Risk #{record.risk_level}" } }),
          section("Transcript bridge", transcript_bridge_items(records)),
          section("Evidence highlights", evidence.map { |item| { title: item.title, detail: item.summary, href: Ib::RouteBuilder.href_for(item) } })
        ]
        base_payload(
          title: "#{student_label(student)} DP progress report",
          programme: "DP",
          audience: audience,
          summary: "#{records.count} DP milestone(s) and #{evidence.count} evidence highlight(s) included.",
          sections: sections,
          source_refs: refs_for(records) + refs_for(evidence),
          family_prompts: records.filter_map { |record| record.next_action.presence }.first(3),
          conference_prompts: conference_questions(student),
          report_theme: "dp_orbit"
        )
      end

      def build_conference_payload(student:, audience:)
        pyp = build_pyp_payload(student: student, audience: audience)
        myp = build_myp_payload(student: student, audience: audience)
        dp = build_dp_payload(student: student, audience: audience)
        sections = [
          section("Progress highlights", [ pyp, myp, dp ].map { |payload| { title: payload[:title], detail: payload[:summary] } }),
          section("Questions to ask", conference_questions(student)),
          section("Next steps at home", home_support_items(student))
        ]
        base_payload(
          title: "#{student_label(student)} conference packet",
          programme: programme_for_student(student),
          audience: audience,
          summary: "Conference packet combining live report highlights, questions, and at-home support.",
          sections: sections,
          source_refs: pyp[:source_refs] + myp[:source_refs] + dp[:source_refs],
          family_prompts: home_support_items(student).map { |item| item[:detail] },
          conference_prompts: conference_questions(student).map { |item| item[:detail] },
          report_theme: "conference_canvas"
        )
      end

      def proofing_summary(payload, audience:)
        sections = Array(payload[:sections])
        overlong_items = sections.sum { |section| Array(section[:items]).count { |item| item[:detail].to_s.length > 600 } }
        missing_sections = sections.count { |section| Array(section[:items]).empty? }
        missing_titles = sections.sum { |section| Array(section[:items]).count { |item| item[:title].to_s.blank? } }
        fallback_locales = Array(payload.dig(:localization, :fallback_locales))

        {
          missing_sections: missing_sections,
          overlong_items: overlong_items,
          missing_titles: missing_titles,
          translation_fallback: fallback_locales.any?,
          translation_review_required: payload.dig(:localization, :translation_review_required),
          conference_ready: Array(payload.dig(:conference_packet, :student_led_prompts)).any?,
          family_view_ready: audience != "guardian" || Array(payload.dig(:conference_packet, :family_support)).any?,
          preflight_warnings: preflight_warnings_for(payload, missing_sections: missing_sections, overlong_items: overlong_items, missing_titles: missing_titles),
          signoff_ready: sections.none? { |section| Array(section[:items]).empty? }
        }
      end

      def render_payload(payload, report:, version_number:)
        html = Array(payload[:sections]).map do |section|
          <<~HTML
            <section>
              <h2>#{ERB::Util.html_escape(section[:title].to_s)}</h2>
              <ul>
                #{Array(section[:items]).map { |item| "<li><strong>#{ERB::Util.html_escape(item[:title].to_s)}</strong>: #{ERB::Util.html_escape(item[:detail].to_s)}</li>" }.join}
              </ul>
            </section>
          HTML
        end.join

        storage_key = "reports/#{report.id}/versions/#{version_number}"
        {
          format: "html",
          html: html,
          print_ready: true,
          web_viewer: {
            enabled: true,
            route: "/ib/reports#report-#{report.id}",
            navigation_mode: "section_jump"
          },
          print_layout: {
            template: payload.dig(:render_contract, :print_layout, :template),
            page_size: "A4",
            bleed: false,
            margins: "comfortable"
          },
          artifact_bundle: {
            pdf_url: "/artifacts/#{storage_key}.pdf",
            print_url: "/artifacts/#{storage_key}.print.html",
            web_url: "/ib/reports#report-#{report.id}"
          },
          artifact_storage: {
            backend: "active_storage",
            storage_key: storage_key,
            retention: "7y"
          },
          theme_tokens: payload.dig(:render_contract, :theme_tokens) || {},
          localization: payload[:localization]
        }
      end

      def section(title, items)
        { title: title, items: Array(items) }
      end

      def base_payload(title:, programme:, audience:, summary:, sections:, source_refs:, family_prompts:, conference_prompts:, report_theme:)
        {
          title: title,
          programme: programme,
          audience: audience,
          summary: summary,
          sections: sections,
          source_refs: source_refs.uniq,
          localization: localization_contract(audience),
          conference_packet: {
            student_led_prompts: Array(conference_prompts),
            family_support: Array(family_prompts),
            family_view_enabled: audience.in?(%w[guardian student conference]),
            acknowledgement_required: audience == "guardian"
          },
          render_contract: {
            web_layout: "section_stack",
            print_layout: { template: "ib_#{programme.downcase}_report" },
            theme_tokens: {
              report_theme: report_theme,
              tone: audience == "guardian" ? "calm" : "professional"
            }
          }
        }
      end

      def scoped_evidence(student, programme:)
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id, programme: programme)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(student_id: student.id) if student
        scope.order(updated_at: :desc)
      end

      def scoped_stories(student, programme:)
        scope = IbLearningStory.where(tenant_id: user.tenant_id, programme: programme)
        scope = scope.where(school_id: school.id) if school
        if student
          student_id = student.id.to_s
          scope = scope.where(
            "metadata ->> 'student_id' = ? OR metadata::text ILIKE ?",
            student_id,
            "%#{student_id}%"
          )
        end
        scope.order(published_at: :desc, updated_at: :desc)
      end

      def scoped_records(student, programme:)
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id, programme: programme)
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(student_id: student.id) if student
        scope.order(due_on: :asc, updated_at: :desc)
      end

      def refs_for(records)
        Array(records).map { |record| Ib::RouteBuilder.entity_ref_for(record) rescue "#{record.class.name}:#{record.id}" }
      end

      def current_academic_year
        return @current_academic_year if defined?(@current_academic_year)

        @current_academic_year = if school
          AcademicYear.where(tenant_id: user.tenant_id).where("start_date <= ? AND end_date >= ?", Date.current, Date.current).order(start_date: :desc).first
        else
          AcademicYear.where(tenant_id: user.tenant_id).order(start_date: :desc).first
        end
      end

      def conference_questions(student)
        [
          { title: "What growth feels strongest right now?", detail: "Ask #{student_label(student)} which recent evidence felt most meaningful." },
          { title: "Where does support help most?", detail: "Discuss the next milestone or reflection with the highest friction." }
        ]
      end

      def home_support_items(student)
        scoped_stories(student, programme: programme_for_student(student)).filter_map do |story|
          next if story.support_prompt.blank?

          { title: story.title, detail: story.support_prompt }
        end.first(4)
      end

      def transcript_bridge_items(records)
        records.select { |record| record.record_family.in?(%w[dp_ia dp_ee dp_tok]) }.first(3).map do |record|
          {
            title: record.title,
            detail: "Registrar bridge ready for #{record.record_family.tr('_', ' ')} export."
          }
        end
      end

      def programme_for_student(student)
        return "Mixed" if student.nil?

        record = IbOperationalRecord.where(tenant_id: user.tenant_id, school_id: school&.id, student_id: student.id).order(updated_at: :desc).first
        record&.programme || "Mixed"
      end

      def template_key_for(report_family, audience)
        "ib.reporting.#{report_family}.#{audience}.v1"
      end

      def student_label(student)
        return school&.name || "Whole school" if student.nil?

        [ student.try(:first_name), student.try(:last_name) ].compact.join(" ").presence || student.email || "Student ##{student.id}"
      end

      def serialize_version(version)
        return nil if version.nil?

        {
          id: version.id,
          version_number: version.version_number,
          status: version.status,
          template_key: version.template_key,
          content_payload: version.content_payload,
          render_payload: version.render_payload,
          proofing_summary: version.proofing_summary,
          signed_off_at: version.signed_off_at&.utc&.iso8601,
          rendered_at: version.rendered_at&.utc&.iso8601 || version.created_at&.utc&.iso8601
        }
      end

      def serialize_delivery(delivery)
        {
          id: delivery.id,
          audience_role: delivery.audience_role,
          channel: delivery.channel,
          locale: delivery.locale,
          status: delivery.status,
          delivered_at: delivery.delivered_at&.utc&.iso8601,
          read_at: delivery.read_at&.utc&.iso8601,
          acknowledged_at: delivery.acknowledged_at&.utc&.iso8601,
          artifact_url: delivery.metadata["artifact_url"] || artifact_url_for(delivery.ib_report, channel: delivery.channel),
          archive_key: delivery.metadata["archive_key"],
          feedback_window: delivery.metadata["feedback_window"],
          analytics: {
            opened: delivery.read_at.present?,
            acknowledged: delivery.acknowledged_at.present?,
            correction_loop_open: ActiveModel::Type::Boolean.new.cast(delivery.failure_payload["correction_requested"])
          },
          proofing_state: delivery.ib_report_version&.proofing_summary || {}
        }
      end

      def delivery_targets(report, recipient, audience_role)
        return [ recipient ] if recipient.present?

        targets = []

        if audience_role.in?(%w[guardian conference]) && report.student_id.present?
          guardian_ids = GuardianLink.active.where(student_id: report.student_id).pluck(:guardian_id)
          targets.concat(User.where(id: guardian_ids))
        end

        if audience_role.in?(%w[student conference]) && report.student.present?
          targets << report.student
        end

        targets << user if targets.empty?
        targets.compact.uniq(&:id)
      end

      def sync_receipt!(report, delivery, locale:)
        return if delivery.recipient.nil?

        receipt = IbDeliveryReceipt.find_or_initialize_by(
          tenant: user.tenant,
          school: school,
          user: delivery.recipient,
          deliverable_type: "IbReport",
          deliverable_id: report.id,
          audience_role: delivery.audience_role
        )
        receipt.assign_attributes(
          state: "delivered",
          locale: locale,
          metadata: receipt.metadata.to_h.merge("delivery_id" => delivery.id)
        )
        receipt.save!
      end

      def record_event(report, event_name, metadata: {})
        Ib::Support::ActivityEventService.record!(
          tenant: user.tenant,
          user: user,
          school: school,
          event_name: event_name,
          event_family: "reporting",
          surface: "reports",
          programme: report.programme,
          entity_ref: "IbReport:#{report.id}",
          metadata: metadata.merge(report_family: report.report_family, audience: report.audience)
        )
      end

      def matching_template(report_family:, audience:, programme:)
        scope = IbReportTemplate.where(tenant_id: user.tenant_id, family: report_family, audience: audience)
        scope = scope.where(school_id: [ school&.id, nil ].compact) if school
        scope = scope.where(programme: [ programme, "Mixed" ])
        scope.where(status: [ "active", "draft" ]).order(Arel.sql("CASE WHEN programme = '#{programme}' THEN 0 ELSE 1 END"), updated_at: :desc).first
      end

      def active_cycle_for(programme)
        scope = IbReportCycle.where(tenant_id: user.tenant_id, status: %w[open proofing approved scheduled])
        scope = scope.where(school_id: school.id) if school
        scope = scope.where(programme: [ programme, "Mixed" ])
        scope.order(Arel.sql("CASE WHEN programme = '#{programme}' THEN 0 ELSE 1 END"), updated_at: :desc).first
      end

      def report_contract(report)
        shared_contract = Curriculum::ReportingEngine.contract_for(pack: current_pack_payload)
        {
          version: REPORT_CONTRACT_VERSION,
          family: report.report_family,
          template_name: report.ib_report_template&.name || report.current_version&.template_key,
          cycle_key: report.ib_report_cycle&.cycle_key,
          viewer_modes: %w[web print pdf],
          archive_enabled: true,
          correction_loop_enabled: true,
          engine_key: shared_contract[:engine_key],
          render_hooks: shared_contract[:render_hooks]
        }.merge(shared_contract.slice(:template_inheritance))
      end

      def localization_payload(report)
        payload = report.current_version&.content_payload || {}
        contract = payload["localization"] || report.metadata["localization"] || {}
        {
          default_locale: contract["default_locale"] || "en",
          available_locales: Array(contract["available_locales"] || [ "en" ]),
          fallback_locales: Array(contract["fallback_locales"] || []),
          translation_review_required: ActiveModel::Type::Boolean.new.cast(contract["translation_review_required"]),
          family_language_enabled: ActiveModel::Type::Boolean.new.cast(contract["family_language_enabled"])
        }
      end

      def release_workflow(report)
        current_version = report.current_version
        {
          status: report.status,
          approval_chain: [
            { role: "author", complete: report.status.in?(%w[in_review signed_off released archived]) },
            { role: "reviewer", complete: current_version&.signed_off_at.present? },
            { role: "release", complete: report.released_at.present? },
            { role: "archive", complete: report.deliveries.exists? }
          ],
          ready_for_release: report.proofing_summary["signoff_ready"] && current_version&.signed_off_at.present?,
          acknowledgements_pending: report.deliveries.where.not(acknowledged_at: nil).count < report.deliveries.count
        }
      end

      def archive_entry(report)
        {
          archive_key: archive_key_for(report, locale: localization_payload(report)[:default_locale], audience_role: report.audience),
          retained_versions: report.versions.count,
          last_release_at: report.released_at&.utc&.iso8601,
          artifact_count: [ report.versions.count, report.deliveries.count ].sum,
          storage_backend: "active_storage"
        }
      end

      def analytics_payload(report)
        deliveries = report.deliveries
        delivered = deliveries.where(status: %w[delivered read acknowledged]).count
        read = deliveries.where.not(read_at: nil).count
        acknowledged = deliveries.where.not(acknowledged_at: nil).count
        {
          delivered_count: delivered,
          read_count: read,
          acknowledged_count: acknowledged,
          open_rate: delivered.positive? ? ((read.to_f / delivered) * 100).round(1) : 0.0,
          acknowledgement_rate: delivered.positive? ? ((acknowledged.to_f / delivered) * 100).round(1) : 0.0,
          correction_requests: deliveries.where("failure_payload::text ILIKE ?", "%correction%").count
        }
      end

      def viewer_permissions(report)
        {
          teacher_visible: true,
          coordinator_visible: true,
          guardian_visible: report.audience.in?(%w[guardian conference]),
          student_visible: report.audience.in?(%w[student conference]),
          archive_visible: report.status.in?(%w[released archived])
        }
      end

      def conference_packet_payload(report)
        payload = report.current_version&.content_payload || {}
        packet = payload["conference_packet"] || report.metadata["conference_packet"] || {}
        {
          student_led_prompts: Array(packet["student_led_prompts"]),
          family_support: Array(packet["family_support"]),
          family_view_enabled: ActiveModel::Type::Boolean.new.cast(packet["family_view_enabled"]),
          acknowledgement_required: ActiveModel::Type::Boolean.new.cast(packet["acknowledgement_required"])
        }
      end

      def current_pack_payload
        @current_pack_payload ||= CurriculumPackStore.fetch(
          tenant: user.tenant,
          key: Ib::Governance::RolloutConsoleService::PACK_KEY,
          version: Ib::Governance::RolloutConsoleService::CURRENT_PACK_VERSION
        ) || {}
      end

      def localization_contract(audience)
        {
          default_locale: "en",
          available_locales: audience == "internal" ? [ "en" ] : DEFAULT_GUARDIAN_LOCALES,
          fallback_locales: audience == "internal" ? [] : [ "en" ],
          translation_review_required: audience != "internal",
          family_language_enabled: audience.in?(%w[guardian student conference])
        }
      end

      def preflight_warnings_for(payload, missing_sections:, overlong_items:, missing_titles:)
        warnings = []
        warnings << "One or more sections are empty." if missing_sections.positive?
        warnings << "One or more narrative items exceed the print-safe length budget." if overlong_items.positive?
        warnings << "At least one section item is missing a title." if missing_titles.positive?
        warnings << "Translation fallback will be visible until review completes." if Array(payload.dig(:localization, :fallback_locales)).any?
        warnings
      end

      def artifact_url_for(report, channel:)
        return nil if report.nil?

        current_version = report.current_version
        payload = current_version&.render_payload || {}
        bundle = payload["artifact_bundle"] || {}
        channel_key = case channel
        when "pdf", "email"
          "pdf_url"
        when "conference_packet"
          "print_url"
        else
          "web_url"
        end
        bundle[channel_key] || "/ib/reports#report-#{report.id}"
      end

      def archive_key_for(report, locale:, audience_role:)
        [
          report.programme.to_s.downcase,
          report.report_family,
          report.id,
          audience_role,
          locale
        ].join("/")
      end

      def localization_state_for(report, locale:)
        localization = localization_payload(report)
        return "native" if locale == localization[:default_locale]
        return "translated" if localization[:available_locales].include?(locale)

        "fallback"
      end
    end
  end
end
