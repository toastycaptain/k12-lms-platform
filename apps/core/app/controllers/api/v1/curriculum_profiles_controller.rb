module Api
  module V1
    class CurriculumProfilesController < ApplicationController
      def index
        authorize :curriculum_profile, :index?
        if params[:source].present?
          source = params[:source].to_s
          pack_rows = CurriculumPackStore.list(tenant: Current.tenant)
          pack_rows = filter_pack_rows(pack_rows)
          pack_rows = pack_rows.select { |row| row[:source] == source } if source != "all"

          if ActiveModel::Type::Boolean.new.cast(params[:compact])
            render json: pack_rows.map { |row| compact_pack_payload(row) }
          else
            render json: pack_rows
          end
          return
        end

        profiles = filter_profiles(policy_scope(CurriculumProfile))

        if ActiveModel::Type::Boolean.new.cast(params[:runtime])
          render json: runtime_payload
          return
        end

        if ActiveModel::Type::Boolean.new.cast(params[:compact])
          render json: profiles.map { |profile| compact_profile_payload(profile) }
          return
        end

        render json: profiles
      end

      private

      def filter_profiles(profiles)
        key = params[:key].to_s.presence
        version = params[:version].to_s.presence

        profiles = profiles.select { |profile| profile.dig("identity", "key") == key || profile["key"] == key } if key.present?
        profiles = profiles.select { |profile| profile.dig("versioning", "version") == version || profile["version"] == version } if version.present?
        profiles
      end

      def runtime_payload
        resolved = CurriculumProfileResolver.resolve(tenant: Current.tenant)
        roles = Array(Current.user&.role_names).map(&:to_s)
        nav = resolved[:navigation] || {}

        visible_nav = roles.flat_map { |role| Array(nav[role]) }.uniq

        {
          profile_key: resolved[:profile_key],
          profile_version: resolved[:resolved_profile_version],
          terminology: resolved[:terminology],
          navigation: nav,
          visible_navigation: visible_nav,
          planner_object_schemas: resolved[:planner_object_schemas],
          document_types: resolved[:document_types],
          document_schema_index: resolved[:document_schema_index],
          workflow_definitions: resolved[:workflow_definitions],
          workflow_bindings: resolved[:workflow_bindings],
          framework_bindings: resolved[:framework_bindings],
          report_bindings: resolved[:report_bindings],
          capability_modules: resolved[:capability_modules],
          selected_from: resolved[:selected_from],
          fallback_reason: resolved[:fallback_reason],
          resolution_trace_id: resolved[:resolution_trace_id]
        }
      end

      def compact_profile_payload(profile)
        {
          key: profile.dig("identity", "key"),
          label: profile.dig("identity", "label"),
          version: profile.dig("versioning", "version"),
          status: profile["status"],
          compatibility: profile.dig("versioning", "compatibility")
        }
      end

      def filter_pack_rows(rows)
        key = params[:key].to_s.presence
        version = params[:version].to_s.presence

        rows = rows.select { |row| row[:key] == key } if key.present?
        rows = rows.select { |row| row[:version] == version } if version.present?
        rows
      end

      def compact_pack_payload(row)
        payload = CurriculumPackStore.fetch(tenant: Current.tenant, key: row[:key], version: row[:version]) || {}

        {
          key: row[:key],
          label: row[:label],
          version: row[:version],
          status: row[:pack_status],
          release_status: row[:release_status],
          source: row[:source],
          compatibility: payload.dig("versioning", "compatibility")
        }
      end
    end
  end
end
