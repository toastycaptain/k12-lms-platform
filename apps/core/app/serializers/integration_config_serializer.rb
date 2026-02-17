class IntegrationConfigSerializer < ActiveModel::Serializer
  attributes :id, :tenant_id, :provider, :status, :settings_summary, :created_by_id,
    :created_at, :updated_at

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
