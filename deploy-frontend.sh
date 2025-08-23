#!/bin/bash


set -e

STORAGE_ACCOUNT_NAME=""
RESOURCE_GROUP_NAME="hdg-dev-rg"

echo "Deploying frontend to Azure Storage Static Website..."

if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

if ! az account show &> /dev/null; then
    echo "Error: Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

STORAGE_ACCOUNT_NAME=$(az storage account list \
    --resource-group $RESOURCE_GROUP_NAME \
    --query "[?contains(name, 'hdgdevstorage')].name" \
    --output tsv)

if [ -z "$STORAGE_ACCOUNT_NAME" ]; then
    echo "Error: Storage account not found. Please run deploy-azure-infrastructure.sh first."
    exit 1
fi

echo "Using storage account: $STORAGE_ACCOUNT_NAME"

STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query connectionString \
    --output tsv)

cd document-intelligence-frontend

echo "Installing dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Deploying to Azure Storage Static Website..."
az storage blob upload-batch \
    --destination '$web' \
    --source dist \
    --connection-string "$STORAGE_CONNECTION_STRING" \
    --overwrite

STATIC_WEBSITE_URL=$(az storage account show \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --query "primaryEndpoints.web" \
    --output tsv)

echo "✅ Frontend deployment completed successfully!"
echo "🌐 Static Website URL: $STATIC_WEBSITE_URL"
echo ""
echo "🔧 Next Steps:"
echo "  1. Update frontend .env file with Function App URL"
echo "  2. Rebuild and redeploy if needed"
