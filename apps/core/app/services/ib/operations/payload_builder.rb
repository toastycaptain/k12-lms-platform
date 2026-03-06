module Ib
  module Operations
    class PayloadBuilder
      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def build
        {
          summary_metrics: summary_metrics,
          priority_exceptions: priority_exceptions,
          queues: queues,
          programme_tabs: %w[Whole\ school PYP MYP DP],
          drilldowns: drilldowns,
          thresholds_applied: thresholds,
          generated_at: Time.current.iso8601
        }
      end

      private

      attr_reader :user, :school

      def scoped_documents
        scope = CurriculumDocument.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def scoped_evidence
        scope = IbEvidenceItem.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def scoped_stories
        scope = IbLearningStory.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def scoped_records
        scope = IbOperationalRecord.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def scoped_packets
        scope = IbStandardsPacket.where(tenant_id: user.tenant_id)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def poi_entries
        scope = PypProgrammeOfInquiryEntry.joins(:pyp_programme_of_inquiry).where(tenant_id: user.tenant_id)
        scope = scope.where(pyp_programme_of_inquiries: { school_id: school.id }) if school
        scope
      end

      def summary_metrics
        [
          metric("Support hotspots", priority_exceptions.length, "Current filtered exceptions", "accent"),
          metric("Approvals waiting", scoped_documents.where(status: "pending_approval").count, "Review or moderation needed", "warm"),
          metric("Publishing cadence", scoped_stories.where.not(state: "published").count, "Stories still moving through the queue", "success"),
          metric("Standards gaps", scoped_packets.where.not(export_status: "exported").count, "Evidence packets still incomplete", "accent")
        ]
      end

      def priority_exceptions
        rows = []
        rows.concat document_exceptions
        rows.concat evidence_exceptions
        rows.concat packet_exceptions
        rows.concat poi_exceptions
        rows.concat operational_exceptions
        rows.sort_by { |row| -row[:priority_score].to_i }.first(8)
      end

      def queues
        {
          approvals: scoped_documents.where(status: "pending_approval").count,
          evidence_needing_validation: scoped_evidence.where(status: "needs_validation").count,
          stories_needing_context: scoped_stories.where(state: "needs_context").count,
          operational_risks: scoped_records.where(risk_level: "risk").count,
          standards_packets_in_review: scoped_packets.where(review_state: "in_review").count
        }
      end

      def drilldowns
        [
          { area: "Evidence queue", signal: "#{queues[:evidence_needing_validation]} items still need validation", destination: "/ib/evidence" },
          { area: "Publishing cadence", signal: "#{queues[:stories_needing_context]} stories still need context or scheduling", destination: "/ib/families/publishing" },
          { area: "Review workflow", signal: "#{queues[:approvals]} items are waiting for review", destination: "/ib/review" },
          { area: "MYP coverage", signal: "#{scoped_documents.where(document_type: 'ib_myp_unit').count} MYP units are live", destination: "/ib/myp/coverage" },
          { area: "MYP review", signal: "#{scoped_records.where(programme: 'MYP', risk_level: %w[watch risk]).count} MYP project or service items need attention", destination: "/ib/myp/review" },
          { area: "DP coordinator", signal: "#{scoped_records.where(programme: 'DP', risk_level: %w[watch risk]).count} DP records are carrying risk", destination: "/ib/dp/coordinator" },
          { area: "Standards & Practices", signal: "#{queues[:standards_packets_in_review]} packets are still in review", destination: "/ib/standards-practices" }
        ]
      end

      def thresholds
        setting = IbProgrammeSetting.where(tenant_id: user.tenant_id, school_id: school&.id, programme: "Mixed").first ||
          IbProgrammeSetting.where(tenant_id: user.tenant_id, school_id: nil, programme: "Mixed").first

        setting&.thresholds || {
          approvals_risk: 3,
          evidence_risk: 5,
          story_context_risk: 2,
          standards_gap_risk: 2
        }
      end

      def document_exceptions
        scoped_documents.where(status: "pending_approval").limit(3).map do |document|
          readiness = Ib::ReadinessService.document_summary(document)
          exception_card(
            programme: programme_for(document),
            title: document.title,
            detail: readiness[:ready] ? "Waiting for coordinator review." : "Blocked by #{readiness[:missing_fields].join(', ')}.",
            href: Ib::RouteBuilder.href_for(document),
            entity_ref: Ib::RouteBuilder.entity_ref_for(document),
            risk_reason_codes: readiness[:ready] ? [ "pending_review" ] : [ "missing_required_fields" ],
            priority_score: readiness[:ready] ? 80 : 92,
            tone: readiness[:ready] ? "warm" : "risk"
          )
        end
      end

      def evidence_exceptions
        scoped_evidence.where(status: %w[needs_validation reflection_requested]).limit(3).map do |evidence|
          exception_card(
            programme: evidence.programme,
            title: evidence.title,
            detail: evidence.next_action.presence || evidence.summary.to_s.truncate(120),
            href: "/ib/evidence##{evidence.id}",
            entity_ref: Ib::RouteBuilder.entity_ref_for(evidence),
            risk_reason_codes: [ evidence.status ],
            priority_score: evidence.status == "needs_validation" ? 89 : 74,
            tone: evidence.status == "needs_validation" ? "warm" : "accent"
          )
        end
      end

      def packet_exceptions
        scoped_packets.where.not(export_status: "exported").limit(2).map do |packet|
          exception_card(
            programme: "Mixed",
            title: packet.title,
            detail: "Packet #{packet.code} is #{packet.evidence_strength} and #{packet.export_status.tr('_', ' ')}.",
            href: "/ib/standards-practices",
            entity_ref: Ib::RouteBuilder.entity_ref_for(packet),
            risk_reason_codes: [ packet.review_state, packet.export_status ],
            priority_score: packet.export_status == "ready" ? 68 : 82,
            tone: packet.export_status == "ready" ? "accent" : "warm"
          )
        end
      end

      def poi_exceptions
        poi_entries.where(coherence_signal: %w[watch risk]).limit(2).map do |entry|
          exception_card(
            programme: "PYP",
            title: entry.title,
            detail: "#{entry.year_level} • #{entry.theme} is marked #{entry.coherence_signal}.",
            href: "/ib/pyp/poi",
            entity_ref: Ib::RouteBuilder.entity_ref_for(entry),
            risk_reason_codes: [ "poi_#{entry.coherence_signal}" ],
            priority_score: entry.coherence_signal == "risk" ? 87 : 72,
            tone: entry.coherence_signal == "risk" ? "risk" : "warm"
          )
        end
      end

      def operational_exceptions
        scoped_records.where(risk_level: %w[watch risk]).limit(3).map do |record|
          exception_card(
            programme: record.programme,
            title: record.title,
            detail: record.next_action.presence || record.summary.to_s.truncate(120),
            href: Ib::RouteBuilder.href_for(record),
            entity_ref: Ib::RouteBuilder.entity_ref_for(record),
            risk_reason_codes: [ record.record_family, record.risk_level ],
            priority_score: record.risk_level == "risk" ? 95 : 76,
            tone: record.risk_level == "risk" ? "risk" : "warm"
          )
        end
      end

      def metric(label, value, detail, tone)
        { label: label, value: value.to_s, detail: detail, tone: tone }
      end

      def exception_card(programme:, title:, detail:, href:, entity_ref:, risk_reason_codes:, priority_score:, tone:)
        {
          id: Digest::SHA256.hexdigest("#{title}:#{entity_ref}")[0, 12],
          programme: programme.presence || "Mixed",
          label: title,
          title: title,
          detail: detail,
          href: href,
          entity_ref: entity_ref,
          risk_reason_codes: risk_reason_codes,
          priority_score: priority_score,
          tone: tone,
          status: tone == "risk" ? "risk" : tone == "warm" ? "watch" : "healthy"
        }
      end

      def programme_for(document)
        schema = document.schema_key.to_s
        type = document.document_type.to_s
        return "PYP" if type.start_with?("ib_pyp") || schema.include?("ib.pyp")
        return "MYP" if type.start_with?("ib_myp") || schema.include?("ib.myp")
        return "DP" if type.start_with?("ib_dp") || schema.include?("ib.dp")

        "Mixed"
      end
    end
  end
end
