module Api
  module V1
    class SamlController < ActionController::API
      # GET /api/v1/saml/metadata?tenant=slug
      # Returns SP metadata XML for IdP configuration
      def metadata
        tenant_slug = params[:tenant]
        return render plain: "Tenant required", status: :bad_request if tenant_slug.blank?

        tenant = Tenant.unscoped.find_by(slug: tenant_slug)
        return render plain: "Tenant not found", status: :not_found unless tenant

        settings = OneLogin::RubySaml::Settings.new
        settings.issuer = "k12-lms-#{tenant.slug}"
        settings.assertion_consumer_service_url = "#{request.base_url}/auth/saml/callback?tenant=#{tenant.slug}"
        settings.name_identifier_format = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"

        meta = OneLogin::RubySaml::Metadata.new
        render xml: meta.generate(settings), content_type: "application/xml"
      end
    end
  end
end
