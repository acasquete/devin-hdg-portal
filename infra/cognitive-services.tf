resource "azurerm_cognitive_account" "content_understanding" {
  name                = "cog-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "FormRecognizer"
  sku_name            = "S0"

  tags = local.common_tags
}
