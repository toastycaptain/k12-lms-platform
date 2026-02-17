class AiProviderConfigSerializer < ActiveModel::Serializer
  attributes :id, :provider_name, :display_name, :default_model, :available_models,
             :status, :settings_summary, :tenant_id, :created_by_id, :created_at, :updated_at

  def settings_summary
    return {} if object.settings.blank?

    object.settings.transform_values do |value|
      if value.is_a?(String) && value.length > 4
        "#{value[0..3]}#{"*" * [ value.length - 4, 8 ].min}"
      elsif value.is_a?(String)
        "****"
      else
        value
      end
    end
  end
end
