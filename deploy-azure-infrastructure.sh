#!/bin/bash


set -e

RESOURCE_GROUP_NAME="hdg-dev-rg"
LOCATION="eastus"
STORAGE_ACCOUNT_NAME="hdgdevstorage$(date +%s | tail -c 6)"
COSMOS_DB_ACCOUNT_NAME="hdg-dev-cosmos"
COSMOS_DB_NAME="DocumentIntelligence"
COSMOS_CONTAINER_NAME="Documents"
FUNCTION_APP_NAME="hdg-dev-functions"
DOCUMENT_INTELLIGENCE_NAME="hdg-dev-docint"
APP_SERVICE_PLAN_NAME="hdg-dev-plan"

echo "Starting Azure infrastructure deployment..."
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Location: $LOCATION"
echo "Storage Account: $STORAGE_ACCOUNT_NAME"

if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

if ! az account show &> /dev/null; then
    echo "Error: Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "Creating Resource Group..."
az group create \
    --name $RESOURCE_GROUP_NAME \
    --location $LOCATION

echo "Creating Storage Account..."
az storage account create \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku Standard_LRS \
    --kind StorageV2

STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query connectionString \
    --output tsv)

echo "Creating blob container for documents..."
az storage container create \
    --name documents \
    --connection-string "$STORAGE_CONNECTION_STRING" \
    --public-access off

echo "Enabling static website hosting..."
az storage blob service-properties update \
    --connection-string "$STORAGE_CONNECTION_STRING" \
    --static-website \
    --index-document index.html \
    --404-document 404.html

echo "Creating Cosmos DB account..."
az cosmosdb create \
    --name $COSMOS_DB_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --locations regionName=$LOCATION \
    --default-consistency-level Session \
    --enable-free-tier false

echo "Creating Cosmos DB database..."
az cosmosdb sql database create \
    --account-name $COSMOS_DB_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --name $COSMOS_DB_NAME

echo "Creating Cosmos DB container..."
az cosmosdb sql container create \
    --account-name $COSMOS_DB_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --database-name $COSMOS_DB_NAME \
    --name $COSMOS_CONTAINER_NAME \
    --partition-key-path "/id" \
    --throughput 400

COSMOS_CONNECTION_STRING=$(az cosmosdb keys list \
    --name $COSMOS_DB_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --type connection-strings \
    --query "connectionStrings[0].connectionString" \
    --output tsv)

echo "Creating Document Intelligence service..."
az cognitiveservices account create \
    --name $DOCUMENT_INTELLIGENCE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --kind FormRecognizer \
    --sku S0

DOCUMENT_INTELLIGENCE_ENDPOINT=$(az cognitiveservices account show \
    --name $DOCUMENT_INTELLIGENCE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query properties.endpoint \
    --output tsv)

DOCUMENT_INTELLIGENCE_KEY=$(az cognitiveservices account keys list \
    --name $DOCUMENT_INTELLIGENCE_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query key1 \
    --output tsv)

echo "Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --location $LOCATION \
    --sku Y1 \
    --is-linux

echo "Creating Function App..."
az functionapp create \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --plan $APP_SERVICE_PLAN_NAME \
    --storage-account $STORAGE_ACCOUNT_NAME \
    --runtime python \
    --runtime-version 3.11 \
    --functions-version 4 \
    --os-type Linux

echo "Configuring Function App settings..."
az functionapp config appsettings set \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --settings \
        "AzureWebJobsStorage=$STORAGE_CONNECTION_STRING" \
        "COSMOS_CONNECTION_STRING=$COSMOS_CONNECTION_STRING" \
        "COSMOS_DATABASE_NAME=$COSMOS_DB_NAME" \
        "COSMOS_CONTAINER_NAME=$COSMOS_CONTAINER_NAME" \
        "DOCUMENT_INTELLIGENCE_ENDPOINT=$DOCUMENT_INTELLIGENCE_ENDPOINT" \
        "DOCUMENT_INTELLIGENCE_KEY=$DOCUMENT_INTELLIGENCE_KEY" \
        "STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION_STRING" \
        "STORAGE_CONTAINER_NAME=documents"

echo "Enabling managed identity for Function App..."
az functionapp identity assign \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME

STATIC_WEBSITE_URL=$(az storage account show \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query "primaryEndpoints.web" \
    --output tsv)

FUNCTION_APP_URL="https://$FUNCTION_APP_NAME.azurewebsites.net"

echo ""
echo "✅ Azure infrastructure deployment completed successfully!"
echo ""
echo "📋 Resource Summary:"
echo "  Resource Group: $RESOURCE_GROUP_NAME"
echo "  Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  Cosmos DB: $COSMOS_DB_ACCOUNT_NAME"
echo "  Function App: $FUNCTION_APP_NAME"
echo "  Document Intelligence: $DOCUMENT_INTELLIGENCE_NAME"
echo ""
echo "🌐 URLs:"
echo "  Function App: $FUNCTION_APP_URL"
echo "  Static Website: $STATIC_WEBSITE_URL"
echo ""
echo "🔧 Next Steps:"
echo "  1. Deploy Azure Functions code to: $FUNCTION_APP_NAME"
echo "  2. Build and deploy frontend to static website"
echo "  3. Update frontend .env with Function App URL"
echo ""
echo "💾 Connection Strings (save these securely):"
echo "  Storage: $STORAGE_CONNECTION_STRING"
echo "  Cosmos DB: $COSMOS_CONNECTION_STRING"
echo "  Document Intelligence Endpoint: $DOCUMENT_INTELLIGENCE_ENDPOINT"
echo ""
