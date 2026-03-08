Rails.autoloaders.each do |autoloader|
  autoloader.inflector.inflect(
    "migration_connector_sdk" => "MigrationConnectorSDK"
  )
end
