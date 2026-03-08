module Ib
  module Search
    class UnifiedSearchService
      Result = Struct.new(
        :record,
        :title,
        :detail,
        :href,
        :entity_ref,
        :programme,
        :kind,
        :updated_at,
        :preview,
        :keywords,
        :metadata,
        :matched_terms,
        :score,
        :redaction,
        keyword_init: true
      )

      SEARCH_SYNONYMS = {
        "essay" => %w[ee extended essay],
        "reflection" => %w[journal reflection response],
        "report" => %w[report conference packet snapshot progress],
        "evidence" => %w[evidence artifact observation],
        "project" => %w[project service milestone personal project],
        "family" => %w[guardian conference home digest],
        "standard" => %w[standard standards criteria rubric]
      }.freeze
      RESULT_LABELS = {
        "document" => "Documents",
        "evidence" => "Evidence",
        "reflection" => "Reflections",
        "story" => "Stories",
        "operational_record" => "Operational records",
        "report" => "Reports",
        "standards_packet" => "Standards",
        "comment" => "Comments",
        "task" => "Tasks",
        "library_item" => "Specialist library",
        "portfolio_collection" => "Portfolio collections"
      }.freeze
      COORDINATOR_LENSES = [
        {
          key: "reflection_follow_up",
          label: "Reflection follow-up",
          query: 'kind:reflection status:requested "next reflection"',
          detail: "Find open reflection requests and advising follow-up."
        },
        {
          key: "family_ready",
          label: "Family-ready evidence",
          query: "kind:evidence visibility:family_ready",
          detail: "Review evidence already ready to publish to families."
        },
        {
          key: "dp_deadlines",
          label: "DP deadlines at risk",
          query: "programme:DP kind:operational_record risk",
          detail: "Watch operational records that need coordinator intervention."
        },
        {
          key: "search_storytelling",
          label: "Published stories",
          query: "kind:story status:published",
          detail: "Surface published stories for conferences and family context."
        }
      ].freeze
      PROFESSIONAL_ROLES = %w[admin curriculum_lead district_admin teacher].freeze
      RESULT_LIMIT = 25

      def initialize(user:, school: nil, tenant: nil)
        @user = user
        @school = school
        @tenant = tenant || user&.tenant || Current.tenant
      end

      def search(query:, limit: 10, kind: nil, programme: nil, filters: {})
        search_payload(query: query, limit: limit, kind: kind, programme: programme, filters: filters).fetch(:results)
      end

      def search_payload(query:, limit: 10, kind: nil, programme: nil, filters: {})
        parsed = QueryParser.new(
          raw_query: query,
          explicit_filters: filters.to_h.merge("kind" => kind, "programme" => programme)
        ).parse

        rows = parsed.text.length < 2 ? [] : ranked_rows(parsed, limit: limit)
        serialized_results = rows.map { |row| serialize(row) }
        knowledge_graph = KnowledgeGraphService.new(results: serialized_results).payload
        payload = {
          query: parsed.raw,
          normalized_query: parsed.text,
          results: serialized_results,
          grouped_results: group_results(serialized_results),
          facets: build_facets(serialized_results),
          query_language: {
            supported_filters: QueryParser::SUPPORTED_FILTERS,
            applied_filters: parsed.filters,
            unsupported_filters: parsed.unsupported_filters,
            synonym_hits: synonym_hits_for(parsed),
            tokens: parsed.tokens
          },
          suggestions: suggestions_for(parsed, serialized_results),
          zero_result_help: serialized_results.empty? ? zero_result_help(parsed) : [],
          related_results: knowledge_graph[:related_results],
          concept_graph: knowledge_graph[:concepts],
          concept_links: knowledge_graph[:links],
          coordinator_lenses: coordinator_lenses,
          student_journey: student_journey(serialized_results),
          freshness: FreshnessService.new(tenant: tenant, school: school).payload,
          semantic_pipeline: semantic_payload(parsed, serialized_results),
          adoption_summary: adoption_summary
        }

        track_search!(parsed, payload)
        payload
      end

      private

      attr_reader :user, :school, :tenant

      def ranked_rows(parsed, limit:)
        filtered_rows =
          candidate_rows(parsed)
            .select { |row| visible_result?(row) }
            .select { |row| row_matches_filters?(row, parsed.filters) }
            .map { |row| apply_redaction(row) }

        filtered_rows
          .each { |row| row.score = relevance_score(row, parsed) }
          .sort_by { |row| [ row.score, row.updated_at || Time.at(0), row.title.to_s.downcase ] }
          .reverse
          .first(clamp_limit(limit))
      end

      def clamp_limit(limit)
        requested = limit.to_i
        requested = 10 unless requested.positive?
        [ requested, RESULT_LIMIT ].min
      end

      def candidate_rows(parsed)
        [
          document_results(parsed),
          evidence_results(parsed),
          reflection_results(parsed),
          story_results(parsed),
          operational_results(parsed),
          report_results(parsed),
          packet_results(parsed),
          comment_results(parsed),
          library_results(parsed),
          portfolio_results(parsed)
        ].flatten
      end

      def document_results(parsed)
        search_scope(
          scoped(CurriculumDocument).left_joins(:current_version).includes(:current_version),
          [
            "curriculum_documents.title",
            "curriculum_documents.document_type",
            "curriculum_documents.schema_key",
            "curriculum_document_versions.title",
            "CAST(curriculum_document_versions.content AS text)"
          ],
          search_terms(parsed)
        )
          .limit(6)
          .map do |document|
            Result.new(
              record: document,
              title: document.title,
              detail: "#{document.document_type.to_s.tr('_', ' ')} • #{document.status}",
              href: Ib::RouteBuilder.href_for(document),
              entity_ref: Ib::RouteBuilder.entity_ref_for(document),
              programme: programme_for_document(document),
              kind: "document",
              updated_at: document.updated_at,
              preview: document.current_version&.content&.to_json&.truncate(180),
              keywords: [ document.document_type, document.schema_key, document.pack_key ],
              metadata: {
                status: document.status,
                visibility: "internal",
                curriculum_document_id: document.id,
                planning_context_id: document.planning_context_id
              }
            )
          end
      end

      def evidence_results(parsed)
        search_scope(scoped(IbEvidenceItem), [ "title", "summary", "next_action", "story_draft" ], search_terms(parsed))
          .limit(8)
          .map do |item|
            Result.new(
              record: item,
              title: item.title,
              detail: item.next_action.presence || item.summary.to_s.truncate(100),
              href: Ib::RouteBuilder.href_for(item),
              entity_ref: Ib::RouteBuilder.entity_ref_for(item),
              programme: item.programme,
              kind: "evidence",
              updated_at: item.updated_at,
              preview: item.story_draft.presence || item.summary,
              keywords: Array(item.metadata["atl_tags"]) + Array(item.metadata["learner_profile"]),
              metadata: {
                status: item.status,
                visibility: item.visibility,
                student_id: item.student_id,
                curriculum_document_id: item.curriculum_document_id,
                planning_context_id: item.planning_context_id
              }
            )
          end
      end

      def reflection_results(parsed)
        search_scope(
          scoped(IbReflectionRequest).includes(:ib_evidence_item),
          [ "prompt", "response_excerpt", "status" ],
          search_terms(parsed)
        ).limit(6).map do |request|
          Result.new(
            record: request,
            title: "Reflection request",
            detail: "#{request.status.tr('_', ' ')} • #{request.prompt.to_s.truncate(96)}",
            href: request.ib_evidence_item ? Ib::RouteBuilder.href_for(request.ib_evidence_item) : "/ib/evidence",
            entity_ref: "IbReflectionRequest:#{request.id}",
            programme: request.ib_evidence_item&.programme || "Mixed",
            kind: "reflection",
            updated_at: request.updated_at,
            preview: request.response_excerpt.presence || request.prompt,
            keywords: Array(request.ib_evidence_item&.metadata&.fetch("learner_profile", [])),
            metadata: {
              status: request.status,
              student_id: request.student_id,
              visibility: request.ib_evidence_item&.visibility,
              evidence_item_id: request.ib_evidence_item_id
            }
          )
        end
      end

      def story_results(parsed)
        search_scope(scoped(IbLearningStory), [ "title", "summary", "support_prompt", "audience" ], search_terms(parsed))
          .limit(6)
          .map do |story|
            Result.new(
              record: story,
              title: story.title,
              detail: "#{story.state.tr('_', ' ')} • #{story.cadence.tr('_', ' ')}",
              href: Ib::RouteBuilder.href_for(story),
              entity_ref: Ib::RouteBuilder.entity_ref_for(story),
              programme: story.programme,
              kind: "story",
              updated_at: story.updated_at,
              preview: story.support_prompt.presence || story.summary,
              keywords: Array(story.metadata["tags"]) + [ story.audience ],
              metadata: {
                status: story.state,
                audience: story.audience,
                student_ids: Array(story.metadata["student_ids"]).map(&:to_i),
                visibility: story.audience
              }
            )
          end
      end

      def operational_results(parsed)
        search_scope(scoped(IbOperationalRecord), [ "title", "summary", "next_action", "record_family", "subtype" ], search_terms(parsed))
          .limit(6)
          .map do |record|
            Result.new(
              record: record,
              title: record.title,
              detail: record.next_action.presence || record.summary.to_s.truncate(100),
              href: Ib::RouteBuilder.href_for(record),
              entity_ref: Ib::RouteBuilder.entity_ref_for(record),
              programme: record.programme,
              kind: "operational_record",
              updated_at: record.updated_at,
              preview: record.summary,
              keywords: [ record.record_family, record.priority, record.risk_level, record.subtype ],
              metadata: {
                status: record.status,
                priority: record.priority,
                risk_level: record.risk_level,
                student_id: record.student_id,
                visibility: "internal"
              }
            )
          end
      end

      def report_results(parsed)
        search_scope(scoped(IbReport), [ "title", "summary", "report_family", "audience", "status" ], search_terms(parsed))
          .limit(6)
          .map do |report|
            Result.new(
              record: report,
              title: report.title,
              detail: "#{report.report_family.tr('_', ' ')} • #{report.audience}",
              href: "/ib/reports#report-#{report.id}",
              entity_ref: "IbReport:#{report.id}",
              programme: report.programme,
              kind: "report",
              updated_at: report.updated_at,
              preview: report.summary,
              keywords: [ report.report_family, report.audience, report.status ],
              metadata: {
                status: report.status,
                audience: report.audience,
                student_id: report.student_id,
                visibility: report.audience
              }
            )
          end
      end

      def packet_results(parsed)
        search_scope(scoped(IbStandardsPacket), [ "title", "code", "review_state", "evidence_strength" ], search_terms(parsed))
          .limit(4)
          .map do |packet|
            Result.new(
              record: packet,
              title: packet.title,
              detail: "Standards packet #{packet.code} • #{packet.review_state}",
              href: "/ib/standards-practices/packets/#{packet.id}",
              entity_ref: "IbStandardsPacket:#{packet.id}",
              programme: "Mixed",
              kind: "standards_packet",
              updated_at: packet.updated_at,
              preview: packet.metadata.to_json.truncate(120),
              keywords: [ packet.code, packet.review_state, packet.evidence_strength ],
              metadata: {
                status: packet.review_state,
                visibility: "internal"
              }
            )
          end
      end

      def comment_results(parsed)
        search_scope(
          scoped(IbDocumentComment).includes(:curriculum_document),
          [
            "ib_document_comments.body",
            "ib_document_comments.comment_type",
            "ib_document_comments.status",
            "ib_document_comments.visibility"
          ],
          search_terms(parsed)
        )
          .limit(6)
          .map do |comment|
            Result.new(
              record: comment,
              title: "Comment on #{comment.curriculum_document&.title || 'document'}",
              detail: comment.body.to_s.truncate(90),
              href: Ib::RouteBuilder.href_for(comment.curriculum_document),
              entity_ref: "IbDocumentComment:#{comment.id}",
              programme: programme_for_document(comment.curriculum_document),
              kind: comment.comment_type == "task" ? "task" : "comment",
              updated_at: comment.updated_at,
              preview: comment.metadata.to_json.truncate(120),
              keywords: [ comment.comment_type, comment.status, comment.visibility ],
              metadata: {
                status: comment.status,
                visibility: comment.visibility,
                parent_comment_id: comment.parent_comment_id,
                curriculum_document_id: comment.curriculum_document_id
              }
            )
          end
      end

      def library_results(parsed)
        search_scope(scoped(IbSpecialistLibraryItem), [ "title", "summary", "item_type" ], search_terms(parsed))
          .limit(4)
          .map do |item|
            Result.new(
              record: item,
              title: item.title,
              detail: "#{item.item_type.to_s.humanize} • reusable specialist asset",
              href: "/ib/specialist#library-#{item.id}",
              entity_ref: "IbSpecialistLibraryItem:#{item.id}",
              programme: item.programme,
              kind: "library_item",
              updated_at: item.updated_at,
              preview: item.summary,
              keywords: Array(item.tags),
              metadata: {
                status: item.status,
                visibility: "internal"
              }
            )
          end
      end

      def portfolio_results(parsed)
        search_scope(scoped(IbPortfolioCollection), [ "title", "narrative_summary", "visibility" ], search_terms(parsed))
          .limit(4)
          .map do |collection|
            Result.new(
              record: collection,
              title: collection.title,
              detail: "Collection • #{collection.visibility.tr('_', ' ')}",
              href: "/ib/student/portfolio##{collection.id}",
              entity_ref: "IbPortfolioCollection:#{collection.id}",
              programme: "Mixed",
              kind: "portfolio_collection",
              updated_at: collection.updated_at,
              preview: collection.narrative_summary,
              keywords: Array(collection.metadata["tags"]),
              metadata: {
                status: "active",
                visibility: collection.visibility,
                student_id: collection.student_id
              }
            )
          end
      end

      def search_scope(scope, columns, terms)
        return scope.none if terms.blank?

        clauses = []
        values = []
        columns.each do |column|
          terms.each do |term|
            clauses << "#{column} ILIKE ?"
            values << like(term)
          end
        end

        scope.where(clauses.join(" OR "), *values)
      end

      def scoped(model)
        scope = Pundit.policy_scope!(user, model)
        scope = scope.where(school_id: school.id) if school && model.column_names.include?("school_id")
        scope
      end

      def like(query)
        "%#{query}%"
      end

      def search_terms(parsed)
        terms = [ parsed.text ]
        terms.concat(synonym_hits_for(parsed).values.flatten)
        terms.concat(parsed.tokens)
        terms.map(&:to_s).map(&:strip).reject(&:blank?).uniq.first(8)
      end

      def visible_result?(row)
        policy = Pundit.policy!(user, row.record)
        return false unless policy.show?
        return professional_user? if professional_user?

        case row.kind
        when "comment", "task", "document", "standards_packet", "library_item"
          false
        when "evidence", "reflection"
          linked_student_access?(row) && row.metadata[:visibility].to_s.in?(visible_evidence_visibilities)
        when "story"
          story_visible_for_user?(row)
        when "operational_record", "portfolio_collection"
          linked_student_access?(row)
        else
          true
        end
      rescue Pundit::NotDefinedError
        false
      end

      def apply_redaction(row)
        return row if professional_user?
        return row unless row.preview.present? || row.detail.present?

        if %w[evidence reflection].include?(row.kind) && row.metadata[:visibility].to_s == "student_visible" && guardian_user?
          row.redaction = "guardian_preview_limited"
          row.preview = "Student-visible evidence. Open with a teacher to review more context."
        elsif row.kind == "report" && row.metadata[:audience].to_s == "conference"
          row.redaction = "conference_packet"
          row.preview = row.preview.to_s.truncate(120)
        end

        row
      end

      def row_matches_filters?(row, filters)
        return true if filters.blank?

        filters.all? do |key, values|
          candidate_values = Array(filter_values_for(row, key)).compact.map(&:to_s)
          (candidate_values & Array(values).map(&:to_s)).any?
        end
      end

      def filter_values_for(row, key)
        case key.to_s
        when "kind" then row.kind
        when "programme" then row.programme
        when "status" then row.metadata[:status]
        when "audience" then row.metadata[:audience]
        when "visibility" then row.metadata[:visibility]
        when "student" then row.metadata[:student_id]
        when "owner" then row.metadata[:owner_id]
        when "lens" then coordinator_lenses.map { |lens| lens[:key] }
        else row.metadata[key.to_sym]
        end
      end

      def relevance_score(row, parsed)
        title = row.title.to_s.downcase
        detail = row.detail.to_s.downcase
        preview = row.preview.to_s.downcase
        keywords = Array(row.keywords).map { |keyword| keyword.to_s.downcase }

        score = 0
        score += 12 if title == parsed.normalized
        score += 8 if title.start_with?(parsed.normalized)
        score += 5 if title.include?(parsed.normalized)
        parsed.tokens.each do |token|
          score += 2 if detail.include?(token)
          score += 2 if preview.include?(token)
          score += 3 if keywords.any? { |keyword| keyword.include?(token) }
        end
        synonym_hits_for(parsed).each_value do |synonyms|
          synonyms.each do |synonym|
            synonym_text = synonym.to_s.downcase
            score += 2 if title.include?(synonym_text) || detail.include?(synonym_text) || preview.include?(synonym_text)
          end
        end
        score += semantic_overlap_score(row, parsed)
        score += recency_score(row.updated_at)
        score += 2 if %w[reflection task report].include?(row.kind.to_s)

        row.matched_terms = matched_terms_for(row, parsed)
        score
      end

      def semantic_overlap_score(row, parsed)
        result_terms = ([ row.title, row.detail, row.preview ] + Array(row.keywords)).join(" ").downcase.scan(/[[:alnum:]_]+/).uniq
        return 0 if result_terms.empty? || parsed.tokens.empty?

        overlap = (result_terms & parsed.tokens).size
        (overlap * 1.5).round
      end

      def matched_terms_for(row, parsed)
        result_terms = ([ row.title, row.detail, row.preview ] + Array(row.keywords)).join(" ").downcase
        (parsed.tokens + synonym_hits_for(parsed).values.flatten.map(&:downcase))
          .uniq
          .select { |token| result_terms.include?(token) }
          .first(6)
      end

      def recency_score(updated_at)
        return 0 unless updated_at

        age_in_days = [ (Time.current - updated_at) / 1.day, 0 ].max
        case age_in_days
        when 0...7 then 3
        when 7...21 then 2
        when 21...60 then 1
        else 0
        end
      end

      def group_results(results)
        results
          .group_by { |result| result[:kind].presence || "other" }
          .map do |kind, grouped|
            {
              key: kind,
              label: RESULT_LABELS[kind] || kind.to_s.humanize,
              count: grouped.length,
              results: grouped
            }
          end
          .sort_by { |group| group[:label] }
      end

      def build_facets(results)
        {
          kind: facet_rows(results, :kind),
          programme: facet_rows(results, :programme),
          status: facet_rows(results, :status),
          visibility: facet_rows(results, :visibility)
        }
      end

      def facet_rows(results, key)
        results.each_with_object(Hash.new(0)) do |result, memo|
          value =
            case key
            when :status then result[:status]
            when :visibility then result[:visibility]
            else result[key]
            end
          memo[value] += 1 if value.present?
        end.map do |facet_key, count|
          {
            key: facet_key,
            label: facet_key.to_s.tr("_", " ").titleize,
            count: count
          }
        end.sort_by { |row| [ -row[:count], row[:label] ] }
      end

      def serialize(result)
        {
          title: result.title,
          detail: result.detail,
          href: result.href,
          entity_ref: result.entity_ref,
          programme: result.programme,
          kind: result.kind,
          updated_at: result.updated_at&.iso8601,
          preview: result.preview,
          keywords: Array(result.keywords),
          status: result.metadata[:status],
          audience: result.metadata[:audience],
          visibility: result.metadata[:visibility],
          matched_terms: Array(result.matched_terms),
          score: result.score.to_i,
          redaction: result.redaction,
          metadata: result.metadata.deep_stringify_keys
        }
      end

      def suggestions_for(parsed, serialized_results)
        suggestions = []
        suggestions.concat(synonym_hits_for(parsed).flat_map { |key, values| [ key, *values ] })
        suggestions.concat(Array(serialized_results.first&.dig(:keywords)))
        suggestions.concat(coordinator_lenses.map { |lens| lens[:query] }) if serialized_results.empty?
        suggestions.uniq.first(6)
      end

      def zero_result_help(parsed)
        [
          {
            key: "broaden_terms",
            label: "Broaden the query",
            detail: "Try fewer words than '#{parsed.text.presence || parsed.raw}'."
          },
          {
            key: "drop_filters",
            label: "Drop filters",
            detail: "Remove kind/programme filters and search across the full IB graph first."
          },
          {
            key: "try_related_terms",
            label: "Try related terms",
            detail: suggestions_for(parsed, []).join(", ")
          }
        ]
      end

      def semantic_payload(parsed, results)
        {
          mode: "lexical_rank_plus_keyword_graph",
          embedding_provider: "disabled",
          fallback_mode: "token_overlap_and_synonyms",
          matched_keywords: results.flat_map { |result| Array(result[:matched_terms]) }.uniq.first(10),
          query_tokens: parsed.tokens
        }
      end

      def coordinator_lenses
        saved_lenses =
          IbSavedSearch
            .where(tenant_id: tenant.id)
            .yield_self { |scope| school ? scope.where(school_id: [ school.id, nil ]) : scope }
            .where.not(lens_key: "quick_search")
            .recent_first
            .limit(3)
            .map do |search|
              {
                key: search.lens_key,
                label: search.name,
                query: search.query,
                detail: search.metadata["surface"].presence || "Saved lens"
              }
            end

        (COORDINATOR_LENSES + saved_lenses).uniq { |lens| [ lens[:label], lens[:query] ] }.first(6)
      end

      def student_journey(results)
        results
          .select { |result| %w[reflection evidence story portfolio_collection].include?(result[:kind]) }
          .first(5)
          .map do |result|
            {
              title: result[:title],
              href: result[:href],
              kind: result[:kind],
              detail: result[:detail]
            }
          end
      end

      def adoption_summary
        scope = activity_scope.where(event_name: %w[ib.search.executed ib.search.zero_result ib.search.result_opened ib.search.saved])
        total_queries = scope.where(event_name: %w[ib.search.executed ib.search.zero_result]).count
        zero_results = scope.where(event_name: "ib.search.zero_result").count
        clicks = scope.where(event_name: "ib.search.result_opened").count
        saves = scope.where(event_name: "ib.search.saved").count

        {
          searches_last_14_days: total_queries,
          zero_result_rate: total_queries.zero? ? 0.0 : (zero_results.to_f / total_queries).round(2),
          click_through_rate: total_queries.zero? ? 0.0 : (clicks.to_f / total_queries).round(2),
          saved_lens_count: saves
        }
      end

      def activity_scope
        scope = IbActivityEvent.where(tenant_id: tenant.id).where("occurred_at >= ?", 14.days.ago)
        scope = scope.where(school_id: school.id) if school
        scope
      end

      def synonym_hits_for(parsed)
        tokens = [ parsed.normalized, *parsed.tokens ].uniq
        SEARCH_SYNONYMS.each_with_object({}) do |(key, values), memo|
          next unless tokens.any? { |token| key.include?(token) || values.any? { |value| value.include?(token) } }

          memo[key] = values
        end
      end

      def programme_for_document(document)
        return "Mixed" if document.nil?

        type = document.document_type.to_s
        return "PYP" if type.start_with?("ib_pyp")
        return "MYP" if type.start_with?("ib_myp")
        return "DP" if type.start_with?("ib_dp")

        "Mixed"
      end

      def professional_user?
        user.role_names.any? { |role| PROFESSIONAL_ROLES.include?(role) }
      end

      def guardian_user?
        user.has_role?(:guardian)
      end

      def visible_evidence_visibilities
        return %w[student_visible guardian_visible family_ready] if student_user?
        return %w[guardian_visible family_ready] if guardian_user?

        IbEvidenceItem::VISIBILITY_TYPES
      end

      def student_user?
        user.has_role?(:student)
      end

      def linked_student_access?(row)
        student_id = row.metadata[:student_id].to_i
        return false if student_id.zero?
        return student_id == user.id if student_user?
        return guardian_student_ids.include?(student_id) if guardian_user?

        false
      end

      def story_visible_for_user?(row)
        return true if professional_user?
        student_ids = Array(row.metadata[:student_ids]).map(&:to_i)

        if guardian_user?
          return false unless row.metadata[:audience].to_s.in?(%w[guardian conference mixed all])

          student_ids.blank? || (student_ids & guardian_student_ids).any?
        elsif student_user?
          return false unless row.metadata[:audience].to_s.in?(%w[student conference mixed all guardian])

          student_ids.blank? || student_ids.include?(user.id)
        else
          false
        end
      end

      def guardian_student_ids
        @guardian_student_ids ||= GuardianLink.active.where(guardian_id: user.id).pluck(:student_id)
      end

      def track_search!(parsed, payload)
        return unless tenant

        metadata = {
          event_family: "search_and_navigation",
          surface: "search",
          programme: payload[:results].first&.dig(:programme) || parsed.filters["programme"]&.first || "Mixed",
          query: parsed.raw,
          normalized_query: parsed.text,
          result_count: payload[:results].length,
          applied_filters: payload[:query_language][:applied_filters],
          zero_result: payload[:results].empty?,
          concept_count: payload[:concept_graph].length
        }

        Ib::Support::Telemetry.emit(
          event: payload[:results].empty? ? "ib.search.zero_result" : "ib.search.executed",
          tenant: tenant,
          user: user,
          school: school,
          metadata: metadata
        )
      rescue StandardError => error
        Rails.logger.warn("[ib.search] unable to record telemetry: #{error.class}: #{error.message}")
      end
    end
  end
end
