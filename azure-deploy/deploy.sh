#!/bin/bash


set -e

RESOURCE_GROUP_NAME="rg-document-management"
LOCATION="eastus"
STORAGE_ACCOUNT_NAME="stdocuments$(date +%s)"
COSMOS_ACCOUNT_NAME="cosmos-documents-$(date +%s)"
COSMOS_DATABASE_NAME="documents"
COSMOS_CONTAINER_NAME="metadata"

echo "🚀 Starting Azure resource deployment..."

echo "📦 Creating Resource Group: $RESOURCE_GROUP_NAME"
az group create \
  --name $RESOURCE_GROUP_NAME \
  --location $LOCATION

echo "💾 Creating Storage Account: $STORAGE_ACCOUNT_NAME"
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot

echo "🔑 Getting Storage Account connection string..."
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --query connectionString \
  --output tsv)

echo "📁 Creating Storage Container: documents"
az storage container create \
  --name documents \
  --connection-string "$STORAGE_CONNECTION_STRING" \
  --public-access off

echo "🌍 Creating Cosmos DB Account: $COSMOS_ACCOUNT_NAME"
az cosmosdb create \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --locations regionName=$LOCATION \
  --default-consistency-level Session \
  --enable-automatic-failover false

echo "🗄️ Creating Cosmos DB Database: $COSMOS_DATABASE_NAME"
az cosmosdb sql database create \
  --account-name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --name $COSMOS_DATABASE_NAME

echo "📋 Creating Cosmos DB Container: $COSMOS_CONTAINER_NAME"
az cosmosdb sql container create \
  --account-name $COSMOS_ACCOUNT_NAME \
  --database-name $COSMOS_DATABASE_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --name $COSMOS_CONTAINER_NAME \
  --partition-key-path "/id" \
  --throughput 400

echo "🔑 Getting Cosmos DB connection details..."
COSMOS_ENDPOINT=$(az cosmosdb show \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --query documentEndpoint \
  --output tsv)

COSMOS_KEY=$(az cosmosdb keys list \
  --name $COSMOS_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --query primaryMasterKey \
  --output tsv)

echo "📝 Generating environment variables..."
cat > .env.production << EOF
AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONNECTION_STRING
AZURE_STORAGE_CONTAINER_NAME=documents

AZURE_COSMOS_ENDPOINT=$COSMOS_ENDPOINT
AZURE_COSMOS_KEY=$COSMOS_KEY
AZURE_COSMOS_DATABASE_NAME=$COSMOS_DATABASE_NAME
AZURE_COSMOS_CONTAINER_NAME=$COSMOS_CONTAINER_NAME

API_KEY=$(openssl rand -hex 32)
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=application/pdf,image/png,image/jpeg,image/tiff
EOF

echo "✅ Azure resources created successfully!"
echo ""
echo "📋 Resource Summary:"
echo "  Resource Group: $RESOURCE_GROUP_NAME"
echo "  Storage Account: $STORAGE_ACCOUNT_NAME"
echo "  Cosmos DB Account: $COSMOS_ACCOUNT_NAME"
echo "  Location: $LOCATION"
echo ""
echo "🔧 Environment variables saved to: .env.production"
echo "📖 Copy these variables to your backend .env file"
echo ""
echo "🌐 Frontend environment variables:"
echo "VITE_API_BASE_URL=https://your-backend-url.azurewebsites.net"
echo "VITE_API_KEY=$(grep API_KEY .env.production | cut -d'=' -f2)"
