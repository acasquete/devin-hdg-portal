#!/bin/bash


set -e

FUNCTION_APP_NAME="hdg-dev-functions"
RESOURCE_GROUP_NAME="hdg-dev-rg"

echo "Deploying Azure Functions to $FUNCTION_APP_NAME..."

if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI is not installed. Please install it first."
    exit 1
fi

if ! az account show &> /dev/null; then
    echo "Error: Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

if ! az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP_NAME &> /dev/null; then
    echo "Error: Function App $FUNCTION_APP_NAME not found. Please run deploy-azure-infrastructure.sh first."
    exit 1
fi

cd azure-functions

echo "Creating deployment package..."
zip -r ../function-app.zip . -x "local.settings.json" "__pycache__/*" "*.pyc"

echo "Deploying to Azure Functions..."
az functionapp deployment source config-zip \
    --name $FUNCTION_APP_NAME \
    --resource-group $RESOURCE_GROUP_NAME \
    --src ../function-app.zip

rm ../function-app.zip

echo "✅ Azure Functions deployment completed successfully!"
echo "🌐 Function App URL: https://$FUNCTION_APP_NAME.azurewebsites.net"
echo ""
echo "📋 Available endpoints:"
echo "  POST /api/documents - Upload document for analysis"
echo "  GET /api/documents/{id} - Get document status and results"
echo "  GET /api/health - Health check"
