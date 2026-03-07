module Ib
  module Search
    class UnifiedSearchService
      Result = Struct.new(:title, :detail, :href, :entity_ref, :programme, :kind, :updated_at, keyword_init: true)

      def initialize(user:, school: nil)
        @user = user
        @school = school
      end

      def search(query:, limit: 10)
        normalized = query.to_s.strip
        return [] if normalized.length < 2

        rows = []
        rows.concat document_results(normalized)
        rows.concat evidence_results(normalized)
        rows.concat story_results(normalized)
        rows.concat operational_results(normalized)
        rows.concat report_results(normalized)
        rows.concat packet_results(normalized)
        rows.concat comment_results(normalized)
        rows.concat library_results(normalized)
        rows.concat portfolio_results(normalized)

        rows
          .sort_by { |row| [ relevance_score(row, normalized), row.updated_at || Time.at(0), row.title ] }
          .reverse
          .first(limit.to_i.positive? ? [ limit.to_i, 25 ].min : 10)
          .map { |row| serialize(row) }
      end

      private

      attr_reader :user, :school

      def document_results(query)
        scoped(CurriculumDocument)
          .includes(:current_version)
          .where("title ILIKE ?", like(query))
          .limit(5)
          .map do |document|
            Result.new(
              title: document.title,
              detail: "#{document.document_type.tr('_', ' ')} • #{document.status}",
              href: Ib::RouteBuilder.href_for(document),
              entity_ref: Ib::RouteBuilder.entity_ref_for(document),
              programme: programme_for_document(document),
              kind: "document",
              updated_at: document.updated_at
            )
          end
      end

      def evidence_results(query)
        scoped(IbEvidenceItem)
          .where("title ILIKE ? OR summary ILIKE ?", like(query), like(query))
          .limit(5)
          .map do |item|
            Result.new(
              title: item.title,
              detail: item.next_action.presence || item.summary.to_s.truncate(80),
              href: Ib::RouteBuilder.href_for(item),
              entity_ref: Ib::RouteBuilder.entity_ref_for(item),
              programme: item.programme,
              kind: "evidence",
              updated_at: item.updated_at
            )
          end
      end

      def story_results(query)
        scoped(IbLearningStory)
          .where("title ILIKE ? OR summary ILIKE ?", like(query), like(query))
          .limit(5)
          .map do |story|
            Result.new(
              title: story.title,
              detail: "#{story.state.tr('_', ' ')} • #{story.cadence.tr('_', ' ')}",
              href: Ib::RouteBuilder.href_for(story),
              entity_ref: Ib::RouteBuilder.entity_ref_for(story),
              programme: story.programme,
              kind: "story",
              updated_at: story.updated_at
            )
          end
      end

      def operational_results(query)
        scoped(IbOperationalRecord)
          .where("title ILIKE ? OR summary ILIKE ? OR next_action ILIKE ?", like(query), like(query), like(query))
          .limit(5)
          .map do |record|
            Result.new(
              title: record.title,
              detail: record.next_action.presence || record.summary.to_s.truncate(80),
              href: Ib::RouteBuilder.href_for(record),
              entity_ref: Ib::RouteBuilder.entity_ref_for(record),
              programme: record.programme,
              kind: "operational_record",
              updated_at: record.updated_at
            )
          end
      end

      def report_results(query)
        scoped(IbReport)
          .where("title ILIKE ? OR summary ILIKE ?", like(query), like(query))
          .limit(5)
          .map do |report|
            Result.new(
              title: report.title,
              detail: "#{report.report_family.tr('_', ' ')} • #{report.audience}",
              href: "/ib/reports#report-#{report.id}",
              entity_ref: "IbReport:#{report.id}",
              programme: report.programme,
              kind: "report",
              updated_at: report.updated_at
            )
          end
      end

      def packet_results(query)
        scoped(IbStandardsPacket)
          .where("title ILIKE ? OR code ILIKE ?", like(query), like(query))
          .limit(4)
          .map do |packet|
            Result.new(
              title: packet.title,
              detail: "Standards packet #{packet.code} • #{packet.review_state}",
              href: "/ib/standards-practices/packets/#{packet.id}",
              entity_ref: "IbStandardsPacket:#{packet.id}",
              programme: "Mixed",
              kind: "standards_packet",
              updated_at: packet.updated_at
            )
          end
      end

      def comment_results(query)
        scoped(IbDocumentComment)
          .where("body ILIKE ?", like(query))
          .limit(4)
          .map do |comment|
            Result.new(
              title: "Comment on #{comment.curriculum_document&.title || 'document'}",
              detail: comment.body.to_s.truncate(90),
              href: Ib::RouteBuilder.href_for(comment.curriculum_document),
              entity_ref: "IbDocumentComment:#{comment.id}",
              programme: programme_for_document(comment.curriculum_document),
              kind: comment.comment_type == "task" ? "task" : "comment",
              updated_at: comment.updated_at
            )
          end
      end

      def library_results(query)
        scoped(IbSpecialistLibraryItem)
          .where("title ILIKE ? OR summary ILIKE ?", like(query), like(query))
          .limit(4)
          .map do |item|
            Result.new(
              title: item.title,
              detail: "#{item.item_type.humanize} • reusable specialist asset",
              href: "/ib/specialist#library-#{item.id}",
              entity_ref: "ib_specialist_library_item:#{item.id}",
              programme: item.programme,
              kind: "library_item",
              updated_at: item.updated_at
            )
          end
      end

      def portfolio_results(query)
        scoped(IbPortfolioCollection)
          .where("title ILIKE ? OR narrative_summary ILIKE ?", like(query), like(query))
          .limit(4)
          .map do |collection|
            Result.new(
              title: collection.title,
              detail: "Collection • #{collection.visibility.tr('_', ' ')}",
              href: "/ib/student/portfolio##{collection.id}",
              entity_ref: "ib_portfolio_collection:#{collection.id}",
              programme: "Mixed",
              kind: "portfolio_collection",
              updated_at: collection.updated_at
            )
          end
      end

      def scoped(model)
        scope = Pundit.policy_scope!(user, model)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        scope
      end

      def serialize(result)
        {
          title: result.title,
          detail: result.detail,
          href: result.href,
          entity_ref: result.entity_ref,
          programme: result.programme,
          kind: result.kind,
          updated_at: result.updated_at&.iso8601
        }
      end

      def like(query)
        "%#{query}%"
      end

      def programme_for_document(document)
        return "Mixed" if document.nil?

        type = document.document_type.to_s
        return "PYP" if type.start_with?("ib_pyp")
        return "MYP" if type.start_with?("ib_myp")
        return "DP" if type.start_with?("ib_dp")

        "Mixed"
      end

      def relevance_score(result, query)
        title = result.title.to_s.downcase
        detail = result.detail.to_s.downcase
        normalized = query.downcase
        score = 0
        score += 8 if title == normalized
        score += 5 if title.start_with?(normalized)
        score += 3 if title.include?(normalized)
        score += 1 if detail.include?(normalized)
        score += 2 if %w[report task comment].include?(result.kind.to_s)
        score
      end
    end
  end
end
