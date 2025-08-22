
resource "azurerm_role_assignment" "cosmos_data_contributor" {
  scope                = azurerm_cosmosdb_account.main.id
  role_definition_name = "Cosmos DB Account Reader Role"
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}

resource "azurerm_role_definition" "cosmos_data_contributor" {
  name        = "Cosmos DB Data Contributor - ${local.resource_prefix}"
  scope       = azurerm_cosmosdb_account.main.id
  description = "Can read and write to Cosmos DB containers"

  permissions {
    actions = [
      "Microsoft.DocumentDB/databaseAccounts/readMetadata",
      "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/*",
      "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/read"
    ]
  }

  assignable_scopes = [
    azurerm_cosmosdb_account.main.id
  ]
}

resource "azurerm_role_assignment" "cosmos_custom" {
  scope              = azurerm_cosmosdb_account.main.id
  role_definition_id = azurerm_role_definition.cosmos_data_contributor.role_definition_resource_id
  principal_id       = azurerm_linux_function_app.main.identity[0].principal_id
}

resource "azurerm_role_assignment" "storage_blob_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}

resource "azurerm_role_assignment" "keyvault_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_function_app.main.identity[0].principal_id
}
