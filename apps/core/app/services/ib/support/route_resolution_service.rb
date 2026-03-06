module Ib
  module Support
    class RouteResolutionService
      ALLOWED_ENTITY_MODELS = {
        "CurriculumDocument" => CurriculumDocument,
        "IbEvidenceItem" => IbEvidenceItem,
        "IbLearningStory" => IbLearningStory,
        "IbPublishingQueueItem" => IbPublishingQueueItem,
        "IbStandardsCycle" => IbStandardsCycle,
        "IbStandardsPacket" => IbStandardsPacket,
        "IbOperationalRecord" => IbOperationalRecord,
        "PypProgrammeOfInquiry" => PypProgrammeOfInquiry,
        "PypProgrammeOfInquiryEntry" => PypProgrammeOfInquiryEntry,
        "IbDocumentComment" => IbDocumentComment
      }.freeze

      def initialize(user:, tenant:, school: nil)
        @user = user
        @tenant = tenant
        @school = school
      end

      def resolve(entity_ref: nil, href: nil)
        return resolve_entity_ref(entity_ref) if entity_ref.present?
        return resolve_href(href) if href.present?

        missing_resolution
      end

      private

      attr_reader :user, :tenant, :school

      def resolve_entity_ref(entity_ref)
        model_name, raw_id = entity_ref.to_s.split(":", 2)
        model = ALLOWED_ENTITY_MODELS[model_name]
        return missing_resolution unless model && raw_id.present?

        record = tenant_record(model, raw_id)
        return missing_resolution(entity_ref: entity_ref) unless record

        build_record_resolution(record, entity_ref: entity_ref)
      end

      def resolve_href(href)
        path = href.to_s.strip
        return missing_resolution if path.blank?

        case path
        when %r{\A/ib/evidence#(\d+)\z}
          redirect_resolution(resolve_entity_ref("IbEvidenceItem:#{$1}"), status: "deprecated_redirect")
        when %r{\A/ib/families/publishing#(\d+)\z}
          queue_item = tenant_record(IbPublishingQueueItem, Regexp.last_match(1))
          story = tenant_record(IbLearningStory, Regexp.last_match(1))
          target = queue_item || story
          target ? redirect_resolution(build_record_resolution(target), status: "deprecated_redirect") : missing_resolution
        when %r{\A/plan/documents/(\d+)\z}, %r{\A/plan/units/(\d+)\z}
          document = tenant_record(CurriculumDocument, Regexp.last_match(1))
          document ? redirect_resolution(build_record_resolution(document), status: "deprecated_redirect") : missing_resolution
        when %r{\A/ib/dp/courses/(\d+)\z}, %r{\A/ib/planning/dp/courses/(\d+)\z}
          redirect_resolution(
            ok_resolution(
              route_id: "ib.dp.course",
              href: "/ib/dp/course-maps/#{Regexp.last_match(1)}",
              fallback_route_id: "ib.planning",
              display_label: "DP Course Map"
            ),
            status: "deprecated_redirect"
          )
        when %r{/demo}
          redirect_resolution(ok_resolution(route_id: "ib.home", href: "/ib/home", fallback_route_id: "ib.home", display_label: "IB Home"), status: "deprecated_redirect")
        else
          missing_resolution
        end
      end

      def build_record_resolution(record, entity_ref: nil)
        if school.present? && record.respond_to?(:school_id) && record.school_id.present? && record.school_id != school.id
          route = ::Ib::RouteBuilder.route_for(record)
          return resolution(
            status: "school_mismatch",
            route_id: route[:route_id],
            href: route[:href],
            fallback_route_id: route[:fallback_route_id],
            display_label: ::Ib::RouteBuilder.display_label_for(record),
            entity_ref: entity_ref || ::Ib::RouteBuilder.entity_ref_for(record)
          )
        end

        policy = Pundit.policy(user, record)
        allowed = policy&.show? || policy&.update? || policy&.create?
        unless allowed
          route = ::Ib::RouteBuilder.route_for(record)
          return resolution(
            status: "forbidden",
            route_id: route[:route_id],
            href: route[:href],
            fallback_route_id: route[:fallback_route_id],
            display_label: ::Ib::RouteBuilder.display_label_for(record),
            entity_ref: entity_ref || ::Ib::RouteBuilder.entity_ref_for(record)
          )
        end

        route = ::Ib::RouteBuilder.route_for(record)
        archived = record.respond_to?(:status) && record.status.to_s == "archived"
        resolution(
          status: archived ? "archived_redirect" : "ok",
          route_id: route[:route_id],
          href: route[:href],
          fallback_route_id: route[:fallback_route_id],
          display_label: ::Ib::RouteBuilder.display_label_for(record),
          entity_ref: entity_ref || ::Ib::RouteBuilder.entity_ref_for(record),
          redirect_to: archived ? fallback_href_for(route[:fallback_route_id]) : nil
        )
      end

      def ok_resolution(route_id:, href:, fallback_route_id:, display_label:)
        resolution(
          status: "ok",
          route_id: route_id,
          href: href,
          fallback_route_id: fallback_route_id,
          display_label: display_label
        )
      end

      def redirect_resolution(base, status:)
        base.merge(status: status, redirect_to: base[:href])
      end

      def missing_resolution(entity_ref: nil)
        resolution(
          status: "not_found",
          route_id: "ib.home",
          href: "/ib/home",
          fallback_route_id: "ib.home",
          display_label: "IB Home",
          entity_ref: entity_ref
        )
      end

      def resolution(status:, route_id:, href:, fallback_route_id:, display_label:, entity_ref: nil, redirect_to: nil)
        {
          status: status,
          route_id: route_id,
          href: href,
          fallback_route_id: fallback_route_id,
          fallback_href: fallback_href_for(fallback_route_id),
          display_label: display_label,
          entity_ref: entity_ref,
          redirect_to: redirect_to
        }
      end

      def tenant_record(model, id)
        scope = model.unscoped.where(tenant_id: tenant.id)
        scope.find_by(id: id)
      end

      def fallback_href_for(route_id)
        {
          "ib.home" => "/ib/home",
          "ib.continuum" => "/ib/continuum",
          "ib.planning" => "/ib/planning",
          "ib.portfolio" => "/ib/portfolio",
          "ib.evidence" => "/ib/evidence",
          "ib.families" => "/ib/families",
          "ib.families.publishing" => "/ib/families/publishing",
          "ib.projects-core" => "/ib/projects-core",
          "ib.standards-practices" => "/ib/standards-practices",
          "ib.operations" => "/ib/operations",
          "ib.review" => "/ib/review",
          "ib.assessment" => "/ib/assessment",
          "ib.dp.core.ee" => "/ib/dp/core/ee",
          "ib.dp.core.tok" => "/ib/dp/core/tok",
          "ib.dp.cas" => "/ib/dp/cas",
          "ib.myp.projects" => "/ib/myp/projects",
          "ib.myp.service" => "/ib/myp/service"
        }.fetch(route_id.to_s, "/ib/home")
      end
    end
  end
end
