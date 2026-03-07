module Ib
  module Reporting
    class ReportService
      REPORT_FAMILIES = %w[pyp_narrative myp_snapshot dp_progress conference_packet].freeze

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def generate!(report_family:, student: nil, audience: "internal", title: nil, metadata: {})
        family = normalize_family(report_family)
        payload = build_payload(report_family: family, student: student, audience: audience)
        proofing = proofing_summary(payload)
        report = IbReport.find_or_initialize_by(
          tenant: user.tenant,
          school: school,
          academic_year: current_academic_year,
          student: student,
          report_family: family,
          audience: audience
        )
        report.assign_attributes(
          programme: payload[:programme],
          title: title.presence || payload[:title],
          summary: payload[:summary],
          source_refs: payload[:source_refs],
          proofing_summary: proofing,
          metadata: report.metadata.merge(metadata.to_h.deep_stringify_keys),
          author: user,
          status: "in_review",
          last_rendered_at: Time.current
        )
        report.save!

        version = report.versions.create!(
          tenant: user.tenant,
          version_number: report.versions.maximum(:version_number).to_i + 1,
          status: "rendered",
          template_key: template_key_for(family, audience),
          content_payload: payload,
          render_payload: render_payload(payload),
          proofing_summary: proofing,
          metadata: { "generated_by_id" => user.id, "family" => family, "audience" => audience }
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
          metadata: { version_id: version.id, report_family: family, audience: audience }
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
          delivery.assign_attributes(
            tenant: user.tenant,
            school: school,
            ib_report_version: report.current_version,
            locale: locale,
            status: "delivered",
            delivered_at: Time.current,
            metadata: delivery.metadata.to_h.merge("delivered_by_id" => user.id)
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
          source_refs: refs_for(stories) + refs_for(evidence)
        )
      end

      def build_myp_payload(student:, audience:)
        records = scoped_records(student, programme: "MYP").where(record_family: %w[myp_project myp_service]).limit(8)
        evidence = scoped_evidence(student, programme: "MYP").limit(6)
        criteria = records.flat_map { |record| Array(record.metadata["criteria"]) }.tally
        atl = evidence.flat_map { |item| Array(item.metadata["atl_tags"]) }.tally
        sections = [
          section("Criteria snapshot", criteria.map { |key, count| { title: key, detail: "#{count} milestone(s)" } }),
          section("ATL snapshot", atl.map { |key, count| { title: key, detail: "#{count} evidence signal(s)" } }),
          section("Term milestones", records.map { |record| { title: record.title, detail: record.next_action || record.summary, href: Ib::RouteBuilder.href_for(record) } })
        ]
        base_payload(
          title: "#{student_label(student)} MYP snapshot",
          programme: "MYP",
          audience: audience,
          summary: "#{records.count} milestone(s) and #{evidence.count} evidence item(s) rolled into a term snapshot.",
          sections: sections,
          source_refs: refs_for(records) + refs_for(evidence)
        )
      end

      def build_dp_payload(student:, audience:)
        records = scoped_records(student, programme: "DP").where(record_family: %w[dp_ia dp_ee dp_tok dp_cas]).limit(10)
        evidence = scoped_evidence(student, programme: "DP").limit(4)
        sections = [
          section("DP milestones", records.map { |record| { title: record.title, detail: record.next_action || record.summary, href: Ib::RouteBuilder.href_for(record) } }),
          section("Risk watch", records.select { |record| record.risk_level.in?(%w[watch risk]) }.map { |record| { title: record.title, detail: "Risk #{record.risk_level}" } }),
          section("Evidence highlights", evidence.map { |item| { title: item.title, detail: item.summary, href: Ib::RouteBuilder.href_for(item) } })
        ]
        base_payload(
          title: "#{student_label(student)} DP progress report",
          programme: "DP",
          audience: audience,
          summary: "#{records.count} DP milestone(s) and #{evidence.count} evidence highlight(s) included.",
          sections: sections,
          source_refs: refs_for(records) + refs_for(evidence)
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
          source_refs: pyp[:source_refs] + myp[:source_refs] + dp[:source_refs]
        )
      end

      def proofing_summary(payload)
        sections = Array(payload[:sections])
        overlong_items = sections.sum { |section| Array(section[:items]).count { |item| item[:detail].to_s.length > 600 } }
        {
          missing_sections: sections.count { |section| Array(section[:items]).empty? },
          overlong_items: overlong_items,
          translation_fallback: false,
          signoff_ready: sections.none? { |section| Array(section[:items]).empty? }
        }
      end

      def render_payload(payload)
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

        {
          format: "html",
          html: html,
          print_ready: true
        }
      end

      def section(title, items)
        { title: title, items: Array(items) }
      end

      def base_payload(title:, programme:, audience:, summary:, sections:, source_refs:)
        {
          title: title,
          programme: programme,
          audience: audience,
          summary: summary,
          sections: sections,
          source_refs: source_refs.uniq
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
          rendered_at: version.rendered_at&.utc&.iso8601
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
          acknowledged_at: delivery.acknowledged_at&.utc&.iso8601
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
    end
  end
end
