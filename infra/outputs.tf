output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "function_app_name" {
  description = "Name of the Function App"
  value       = azurerm_linux_function_app.main.name
}

output "function_app_url" {
  description = "URL of the Function App"
  value       = "https://${azurerm_linux_function_app.main.default_hostname}"
}

output "api_management_url" {
  description = "URL of the API Management gateway"
  value       = "https://${azurerm_api_management.main.gateway_url}"
}

output "storage_account_name" {
  description = "Name of the main storage account"
  value       = azurerm_storage_account.main.name
}

output "cosmos_db_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cognitive_services_endpoint" {
  description = "Cognitive Services endpoint"
  value       = azurerm_cognitive_account.content_understanding.endpoint
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "api_management_subscription_key" {
  description = "API Management subscription key"
  value       = azurerm_api_management_subscription.main.primary_key
  sensitive   = true
}
