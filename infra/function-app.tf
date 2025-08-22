resource "azurerm_service_plan" "main" {
  name                = "asp-${local.resource_prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "Y1"  # Consumption plan

  tags = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = "appi-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"

  tags = local.common_tags
}

resource "azurerm_linux_function_app" "main" {
  name                = "func-${local.resource_prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.main.id

  site_config {
    application_stack {
      python_version = "3.11"
    }
    
    cors {
      allowed_origins = ["*"]
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME"       = "python"
    "AzureWebJobsFeatureFlags"       = "EnableWorkerIndexing"
    "APPINSIGHTS_INSTRUMENTATIONKEY" = azurerm_application_insights.main.instrumentation_key
    
    "BLOB_CONTAINER"                 = azurerm_storage_container.uploads.name
    "AzureWebJobsStorage"           = azurerm_storage_account.functions.primary_connection_string
    
    "COSMOS_URL"                    = azurerm_cosmosdb_account.main.endpoint
    "COSMOS_DB"                     = azurerm_cosmosdb_sql_database.main.name
    "COSMOS_CONTAINER"              = azurerm_cosmosdb_sql_container.documents.name
    
    "ANALYZER_ENDPOINT"             = azurerm_cognitive_account.content_understanding.endpoint
    "ANALYZER_ID"                   = "my-receipts"
    
    "KEY_VAULT_URI"                 = azurerm_key_vault.main.vault_uri
  }

  identity {
    type = "SystemAssigned"
  }

  tags = local.common_tags
}
