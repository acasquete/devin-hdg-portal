resource "azurerm_api_management" "main" {
  name                = "apim-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  publisher_name      = "Document Intelligence"
  publisher_email     = "admin@example.com"
  sku_name            = "Developer_1"

  tags = local.common_tags
}

resource "azurerm_api_management_api" "documents" {
  name                = "documents-api"
  resource_group_name = azurerm_resource_group.main.name
  api_management_name = azurerm_api_management.main.name
  revision            = "1"
  display_name        = "Documents API"
  path                = "api"
  protocols           = ["https"]
  service_url         = "https://${azurerm_linux_function_app.main.default_hostname}/api"

  import {
    content_format = "openapi+json"
    content_value = jsonencode({
      openapi = "3.0.0"
      info = {
        title   = "Document Intelligence API"
        version = "1.0.0"
      }
      paths = {
        "/documents" = {
          post = {
            summary = "Upload document for processing"
            operationId = "uploadDocument"
            parameters = [
              {
                name = "x-tenant-id"
                in = "header"
                required = true
                schema = {
                  type = "string"
                }
              },
              {
                name = "x-user-id"
                in = "header"
                required = true
                schema = {
                  type = "string"
                }
              }
            ]
            requestBody = {
              content = {
                "multipart/form-data" = {
                  schema = {
                    type = "object"
                    properties = {
                      file = {
                        type = "string"
                        format = "binary"
                      }
                    }
                  }
                }
              }
            }
            responses = {
              "202" = {
                description = "Document accepted for processing"
                content = {
                  "application/json" = {
                    schema = {
                      type = "object"
                      properties = {
                        documentId = { type = "string" }
                        resultId = { type = "string" }
                        status = { type = "string" }
                      }
                    }
                  }
                }
              }
            }
          }
          get = {
            summary = "List documents"
            operationId = "listDocuments"
            parameters = [
              {
                name = "x-tenant-id"
                in = "header"
                required = true
                schema = {
                  type = "string"
                }
              }
            ]
            responses = {
              "200" = {
                description = "List of documents"
              }
            }
          }
        }
        "/documents/{documentId}" = {
          get = {
            summary = "Get document status and results"
            operationId = "getDocument"
            parameters = [
              {
                name = "documentId"
                in = "path"
                required = true
                schema = {
                  type = "string"
                }
              }
            ]
            responses = {
              "200" = {
                description = "Document details"
              }
            }
          }
        }
        "/health" = {
          get = {
            summary = "Health check"
            operationId = "healthCheck"
            responses = {
              "200" = {
                description = "Service health status"
              }
            }
          }
        }
      }
    })
  }
}

resource "azurerm_api_management_backend" "function_backend" {
  name                = "function-backend"
  resource_group_name = azurerm_resource_group.main.name
  api_management_name = azurerm_api_management.main.name
  protocol            = "http"
  url                 = "https://${azurerm_linux_function_app.main.default_hostname}/api"
}

resource "azurerm_api_management_api_policy" "documents_policy" {
  api_name            = azurerm_api_management_api.documents.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = azurerm_resource_group.main.name

  xml_content = <<XML
<policies>
  <inbound>
    <rate-limit-by-key calls="100" renewal-period="60" counter-key="@(context.Request.IpAddress)" />
    <rate-limit-by-key calls="1000" renewal-period="3600" counter-key="@(context.Request.Headers.GetValueOrDefault('x-tenant-id','anonymous'))" />
    <base />
  </inbound>
  <backend>
    <base />
  </backend>
  <outbound>
    <base />
  </outbound>
  <on-error>
    <base />
  </on-error>
</policies>
XML
}

resource "azurerm_api_management_subscription" "main" {
  api_management_name = azurerm_api_management.main.name
  resource_group_name = azurerm_resource_group.main.name
  display_name        = "Default Subscription"
  state               = "active"
}
