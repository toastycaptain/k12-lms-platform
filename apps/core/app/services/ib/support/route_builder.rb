module Ib
  module Support
    class RouteBuilder
      class << self
        def href_for(record)
          route_for(record)[:href]
        end

        def route_id_for(record)
          route_for(record)[:route_id]
        end

        def fallback_route_id_for(record)
          route_for(record)[:fallback_route_id]
        end

        def display_label_for(record)
          if record.respond_to?(:title) && record.title.present?
            record.title
          elsif record.is_a?(PypProgrammeOfInquiry) || record.is_a?(PypProgrammeOfInquiryEntry)
            "Programme of Inquiry"
          else
            record.class.model_name.human
          end
        end

        def route_for(record)
          case record
          when CurriculumDocument
            document_route(record)
          when IbEvidenceItem
            route("ib.evidence.item", "/ib/evidence/items/#{record.id}", "ib.evidence")
          when IbLearningStory, IbPublishingQueueItem
            if record.is_a?(IbPublishingQueueItem)
              route("ib.families.publishing.item", "/ib/families/publishing/#{record.id}", "ib.families.publishing")
            else
              route("ib.families.story", "/ib/families/stories/#{record.id}", "ib.families")
            end
          when PypProgrammeOfInquiry, PypProgrammeOfInquiryEntry
            route("ib.pyp.poi", "/ib/pyp/poi", "ib.continuum")
          when IbStandardsCycle, IbStandardsPacket
            if record.is_a?(IbStandardsPacket)
              route("ib.standards.packet", "/ib/standards-practices/packets/#{record.id}", "ib.standards-practices")
            else
              route("ib.standards.cycle", "/ib/standards-practices/cycles/#{record.id}", "ib.standards-practices")
            end
          when IbDocumentComment
            route_for(record.curriculum_document || record)
          when IbOperationalRecord
            operational_route(record)
          else
            route("ib.home", "/ib/home", "ib.home")
          end
        end

        def entity_ref_for(record)
          "#{record.class.name}:#{record.id}"
        end

        def document_route(document)
          schema_key = document.schema_key.to_s
          document_type = document.document_type.to_s
          return route("ib.pyp.unit", "/ib/pyp/units/#{document.id}", "ib.planning") if schema_key.include?("ib.pyp") || document_type.start_with?("ib_pyp")
          return route("ib.myp.interdisciplinary", "/ib/myp/interdisciplinary/#{document.id}", "ib.planning") if schema_key.include?("interdisciplinary") || document_type.include?("interdisciplinary")
          return route("ib.myp.service.entry", "/ib/myp/service/#{document.id}", "ib.myp.service") if schema_key.include?("service_reflection") || document_type == "ib_myp_service_reflection"
          return route("ib.myp.project", "/ib/myp/projects/#{document.id}", "ib.myp.projects") if schema_key.include?("ib.myp.project") || document_type == "ib_myp_project"
          return route("ib.myp.unit", "/ib/myp/units/#{document.id}", "ib.planning") if schema_key.include?("ib.myp") || document_type.start_with?("ib_myp")
          return route("ib.dp.course", "/ib/dp/course-maps/#{document.id}", "ib.planning") if schema_key.include?("course_map") || document_type == "ib_dp_course_map"
          return route("ib.dp.internal-assessment", "/ib/dp/internal-assessments/#{document.id}", "ib.assessment") if schema_key.include?("internal_assessment") || document_type == "ib_dp_internal_assessment"
          return route("ib.dp.ee", "/ib/dp/ee/#{document.id}", "ib.dp.core.ee") if schema_key.include?("extended_essay") || document_type == "ib_dp_extended_essay"
          return route("ib.dp.tok", "/ib/dp/tok/#{document.id}", "ib.dp.core.tok") if schema_key.include?("ib.dp.tok") || document_type == "ib_dp_tok"
          return route("ib.dp.cas.record", "/ib/dp/cas/records/#{document.id}", "ib.dp.cas") if schema_key.include?("ib.dp.cas") || document_type.start_with?("ib_dp_cas")
          return route("ib.dp.course", "/ib/dp/course-maps/#{document.id}", "ib.planning") if schema_key.include?("ib.dp") || document_type.start_with?("ib_dp")

          route("ib.home", "/plan/documents/#{document.id}", "ib.home")
        end

        private

        def extract_id(record)
          record.respond_to?(:ib_learning_story_id) ? record.ib_learning_story_id : record.id
        end

        def operational_route(record)
          if record.route_hint.present?
            return route(
              inferred_route_id_from_href(record.route_hint),
              record.route_hint,
              inferred_fallback_from_href(record.route_hint)
            )
          end

          case record.record_family
          when "specialist"
            route("ib.specialist", "/ib/specialist", "ib.operations")
          when "review"
            route("ib.review", "/ib/review", "ib.operations")
          when "myp_project"
            route("ib.myp.project", "/ib/myp/projects/#{record.id}", "ib.myp.projects")
          when "myp_service"
            route("ib.myp.service.entry", "/ib/myp/service/#{record.id}", "ib.myp.service")
          when "myp_interdisciplinary"
            record.curriculum_document_id.present? ? route("ib.myp.interdisciplinary", "/ib/myp/interdisciplinary/#{record.curriculum_document_id}", "ib.myp.review") : route("ib.myp.review", "/ib/myp/review", "ib.review")
          when "dp_ia"
            route("ib.dp.internal-assessment", "/ib/dp/internal-assessments/#{record.id}", "ib.assessment")
          when "dp_ee"
            route("ib.dp.ee", "/ib/dp/ee/#{record.id}", "ib.dp.core.ee")
          when "dp_tok"
            route("ib.dp.tok", "/ib/dp/tok/#{record.id}", "ib.dp.core.tok")
          when "dp_cas"
            route("ib.dp.cas.record", "/ib/dp/cas/records/#{record.id}", "ib.dp.cas")
          when "dp_core"
            route("ib.dp.coordinator", "/ib/dp/coordinator", "ib.operations")
          when "dp_course_map"
            record.curriculum_document_id.present? ? route("ib.dp.course", "/ib/dp/course-maps/#{record.curriculum_document_id}", "ib.planning") : route("ib.dp.coordinator", "/ib/dp/coordinator", "ib.operations")
          when "pyp_exhibition"
            route("ib.pyp.exhibition", "/ib/pyp/exhibition", "ib.projects-core")
          else
            route("ib.operations", "/ib/operations", "ib.home")
          end
        end

        def route(route_id, href, fallback_route_id)
          {
            route_id: route_id,
            href: href,
            fallback_route_id: fallback_route_id
          }
        end

        def inferred_route_id_from_href(href)
          case href
          when %r{\A/ib/evidence/items/} then "ib.evidence.item"
          when %r{\A/ib/families/stories/} then "ib.families.story"
          when %r{\A/ib/families/publishing/} then "ib.families.publishing.item"
          when %r{\A/ib/standards-practices/cycles/} then "ib.standards.cycle"
          when %r{\A/ib/standards-practices/packets/} then "ib.standards.packet"
          when %r{\A/ib/pyp/poi} then "ib.pyp.poi"
          when %r{\A/ib/pyp/units/} then "ib.pyp.unit"
          when %r{\A/ib/pyp/exhibition} then "ib.pyp.exhibition"
          when %r{\A/ib/myp/units/} then "ib.myp.unit"
          when %r{\A/ib/myp/interdisciplinary/} then "ib.myp.interdisciplinary"
          when %r{\A/ib/myp/projects/\d+} then "ib.myp.project"
          when %r{\A/ib/myp/projects} then "ib.myp.projects"
          when %r{\A/ib/myp/service/\d+} then "ib.myp.service.entry"
          when %r{\A/ib/myp/service} then "ib.myp.service"
          when %r{\A/ib/myp/coverage} then "ib.myp.coverage"
          when %r{\A/ib/myp/review} then "ib.myp.review"
          when %r{\A/ib/dp/course-maps/} then "ib.dp.course"
          when %r{\A/ib/dp/internal-assessments/} then "ib.dp.internal-assessment"
          when %r{\A/ib/dp/ee/} then "ib.dp.ee"
          when %r{\A/ib/dp/tok/} then "ib.dp.tok"
          when %r{\A/ib/dp/cas/records/} then "ib.dp.cas.record"
          when %r{\A/ib/dp/coordinator} then "ib.dp.coordinator"
          when %r{\A/ib/settings} then "ib.settings"
          when %r{\A/ib/rollout} then "ib.rollout"
          when %r{\A/ib/readiness} then "ib.readiness"
          when %r{\A/ib/review} then "ib.review"
          when %r{\A/ib/operations} then "ib.operations"
          else "ib.home"
          end
        end

        def inferred_fallback_from_href(href)
          inferred = inferred_route_id_from_href(href)
          {
            "ib.evidence.item" => "ib.evidence",
            "ib.families.story" => "ib.families",
            "ib.families.publishing.item" => "ib.families.publishing",
            "ib.standards.cycle" => "ib.standards-practices",
            "ib.standards.packet" => "ib.standards-practices",
            "ib.pyp.unit" => "ib.planning",
            "ib.myp.unit" => "ib.planning",
            "ib.myp.interdisciplinary" => "ib.planning",
            "ib.myp.project" => "ib.myp.projects",
            "ib.myp.service.entry" => "ib.myp.service",
            "ib.dp.course" => "ib.planning",
            "ib.dp.internal-assessment" => "ib.assessment",
            "ib.dp.ee" => "ib.dp.core.ee",
            "ib.dp.tok" => "ib.dp.core.tok",
            "ib.dp.cas.record" => "ib.dp.cas",
            "ib.settings" => "ib.operations",
            "ib.rollout" => "ib.operations",
            "ib.readiness" => "ib.operations"
          }.fetch(inferred, "ib.home")
        end
      end
    end
  end

  RouteBuilder = Support::RouteBuilder
end
