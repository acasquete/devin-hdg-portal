# Azure Infrastructure for Document Intelligence Service

This document provides instructions for deploying and managing the Azure infrastructure for the Document Intelligence Service.

## Overview

The Azure infrastructure consists of:
- **Resource Group**: Container for all resources
- **Storage Account**: File storage and static website hosting
- **Cosmos DB**: Document metadata and analysis results storage
- **Azure Functions**: Backend API with Durable Functions for orchestration
- **Azure AI Document Intelligence**: Document analysis service

## Prerequisites

1. Azure CLI installed and configured
2. Azure subscription with appropriate permissions
3. Node.js and npm for frontend deployment

## Quick Start

### 1. Deploy Infrastructure

```bash
# Make script executable and run
chmod +x deploy-azure-infrastructure.sh
./deploy-azure-infrastructure.sh
```

This creates all Azure resources and outputs connection strings and URLs.

### 2. Deploy Azure Functions

```bash
# Deploy the backend API
chmod +x deploy-functions.sh
./deploy-functions.sh
```

### 3. Configure Frontend

```bash
# Copy environment template
cp document-intelligence-frontend/.env.template document-intelligence-frontend/.env

# Edit .env file with your Function App URL
# VITE_API_BASE_URL=https://your-function-app-name.azurewebsites.net/api
```

### 4. Deploy Frontend

```bash
# Deploy to Azure Storage Static Website
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

## API Endpoints

The Azure Functions provide the following endpoints:

### POST /api/documents
Upload a document for analysis.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (binary)

**Response:**
```json
{
  "documentId": "uuid",
  "status": "uploaded",
  "instanceId": "orchestration-instance-id",
  "message": "Document uploaded successfully and analysis started"
}
```

### GET /api/documents/{id}
Get document analysis status and results.

**Response:**
```json
{
  "id": "document-id",
  "sourceFile": "filename.pdf",
  "status": "completed",
  "confidence": 95.2,
  "dangerousGoods": true,
  "hazardCodes": ["UN1203", "UN1993"],
  "extractedFields": {
    "shipper": "Company Name",
    "consignee": "Recipient Name"
  },
  "uploadTimestamp": "2024-08-23T00:00:00Z",
  "analysisCompletedTime": "2024-08-23T00:01:00Z"
}
```

### GET /api/health
Health check endpoint.

## Document Analysis Workflow

1. **Upload**: Document uploaded via POST /api/documents
2. **Storage**: File stored in Azure Blob Storage
3. **Metadata**: Document metadata saved to Cosmos DB
4. **Analysis**: Durable Function orchestrates Azure AI Document Intelligence analysis
5. **Results**: Analysis results stored in Cosmos DB
6. **Status**: Frontend polls GET /api/documents/{id} for status updates

## Configuration

### Environment Variables

The Azure Functions use these environment variables (automatically configured by deployment script):

- `AzureWebJobsStorage`: Storage account connection string
- `COSMOS_CONNECTION_STRING`: Cosmos DB connection string
- `COSMOS_DATABASE_NAME`: Cosmos database name
- `COSMOS_CONTAINER_NAME`: Cosmos container name
- `DOCUMENT_INTELLIGENCE_ENDPOINT`: AI service endpoint
- `DOCUMENT_INTELLIGENCE_KEY`: AI service key
- `STORAGE_CONNECTION_STRING`: Storage connection string
- `STORAGE_CONTAINER_NAME`: Blob container name

### Resource Naming

Resources are created with the following naming convention:
- Resource Group: `hdg-dev-rg`
- Storage Account: `hdgdevstorage{timestamp}`
- Cosmos DB: `hdg-dev-cosmos`
- Function App: `hdg-dev-functions`
- Document Intelligence: `hdg-dev-docint`

## Monitoring and Troubleshooting

### View Function Logs
```bash
az functionapp logs tail --name hdg-dev-functions --resource-group hdg-dev-rg
```

### Check Function Status
```bash
az functionapp show --name hdg-dev-functions --resource-group hdg-dev-rg
```

### View Cosmos DB Data
Use Azure Portal or Azure Cosmos DB Explorer to view stored documents and analysis results.

### Common Issues

1. **Function App not responding**: Check if all environment variables are configured correctly
2. **Document analysis failing**: Verify Document Intelligence service key and endpoint
3. **Storage upload issues**: Check storage account permissions and connection string

## Cost Optimization

- Function App uses Consumption plan (pay-per-execution)
- Cosmos DB configured with 400 RU/s (can be scaled down for development)
- Storage Account uses Standard LRS (locally redundant storage)
- Document Intelligence uses S0 tier (can be changed to F0 for development)

## Security

- Function App uses managed identity where possible
- All connection strings stored as application settings (encrypted at rest)
- Storage containers configured with private access
- CORS enabled for frontend domain only

## Cleanup

To remove all resources:

```bash
az group delete --name hdg-dev-rg --yes --no-wait
```

## Support

For issues with Azure infrastructure:
1. Check Azure Portal for resource status
2. Review Function App logs
3. Verify all environment variables are set correctly
4. Ensure all services are in the same region
