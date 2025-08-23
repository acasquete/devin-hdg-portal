# Azure Deployment Scripts

This directory contains scripts to deploy the Document Management System to Azure.

## Prerequisites

1. Install Azure CLI: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. Login to Azure: `az login`
3. Set your subscription: `az account set --subscription "your-subscription-id"`

## Deployment

### 1. Deploy Azure Resources

```bash
cd azure-deploy
chmod +x deploy.sh
./deploy.sh
```

This script will create:
- Resource Group (`rg-document-management`)
- Storage Account with `documents` container
- Cosmos DB account with `documents` database and `metadata` container
- Generate environment variables file (`.env.production`)

### 2. Configure Backend

Copy the generated environment variables to your backend:

```bash
cp .env.production ../document-intelligence-backend/.env
```

### 3. Deploy Backend

Deploy the FastAPI backend to Azure App Service or Azure Container Instances:

```bash
# Example using Azure App Service
az webapp create \
  --resource-group rg-document-management \
  --plan myAppServicePlan \
  --name my-document-api \
  --runtime "PYTHON|3.12"

# Deploy code (adjust path as needed)
az webapp deployment source config-zip \
  --resource-group rg-document-management \
  --name my-document-api \
  --src ../document-intelligence-backend.zip
```

### 4. Configure Frontend

Update the frontend environment variables:

```bash
# Update document-intelligence-frontend/.env
VITE_API_BASE_URL=https://my-document-api.azurewebsites.net
VITE_API_KEY=your-generated-api-key
```

### 5. Deploy Frontend

Build and deploy the React frontend:

```bash
cd ../document-intelligence-frontend
npm run build

# Deploy to Azure Static Web Apps or Azure Storage
az storage blob upload-batch \
  --destination '$web' \
  --source dist \
  --connection-string "your-storage-connection-string"
```

## Resource Details

### Storage Account
- **Container**: `documents`
- **Access Level**: Private (no public access)
- **Redundancy**: Locally Redundant Storage (LRS)

### Cosmos DB
- **API**: Core (SQL)
- **Database**: `documents`
- **Container**: `metadata`
- **Partition Key**: `/id`
- **Throughput**: 400 RU/s (can be scaled up)

### Security
- API key authentication implemented
- Storage account uses connection string authentication
- Cosmos DB uses master key authentication
- All resources created in the same resource group for easy management

## Cleanup

To remove all Azure resources:

```bash
chmod +x cleanup.sh
./cleanup.sh
```

**Warning**: This will delete ALL resources in the resource group!

## Cost Optimization

- Storage Account: Pay-as-you-use for storage and transactions
- Cosmos DB: 400 RU/s minimum, can be scaled down to 100 RU/s if needed
- Consider using Azure Free Tier resources for development/testing

## Monitoring

Monitor your resources using:
- Azure Portal
- Azure Monitor
- Application Insights (can be added to the backend)

## Troubleshooting

1. **Permission Issues**: Ensure you have Contributor access to the subscription
2. **Naming Conflicts**: Storage account names must be globally unique
3. **Quota Limits**: Check your subscription limits for Cosmos DB and Storage
4. **Network Issues**: Ensure your network allows Azure CLI connections

## Next Steps

1. Set up CI/CD pipeline using Azure DevOps or GitHub Actions
2. Configure custom domain and SSL certificate
3. Add Application Insights for monitoring
4. Set up backup and disaster recovery
5. Implement Azure Active Directory authentication
