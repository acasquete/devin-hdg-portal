import azure.functions as func
import azure.durable_functions as df
import logging
import json
import os
import hashlib
import uuid
from datetime import datetime, timezone
from azure.storage.blob import BlobServiceClient
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
import requests

app = df.DFApp(http_auth_level=func.AuthLevel.ANONYMOUS)

credential = DefaultAzureCredential()
blob_service_client = None
cosmos_client = None
secret_client = None

def get_blob_client():
    global blob_service_client
    if blob_service_client is None:
        storage_connection_string = os.environ.get('AzureWebJobsStorage')
        blob_service_client = BlobServiceClient.from_connection_string(storage_connection_string)
    return blob_service_client

def get_cosmos_client():
    global cosmos_client
    if cosmos_client is None:
        cosmos_url = os.environ.get('COSMOS_URL')
        cosmos_client = CosmosClient(cosmos_url, credential=credential)
    return cosmos_client

def get_secret_client():
    global secret_client
    if secret_client is None:
        key_vault_uri = os.environ.get('KEY_VAULT_URI')
        secret_client = SecretClient(vault_url=key_vault_uri, credential=credential)
    return secret_client

def get_analyzer_key():
    try:
        secret_client = get_secret_client()
        secret = secret_client.get_secret("ANALYZER-KEY")
        return secret.value
    except Exception as e:
        logging.error(f"Failed to get analyzer key from Key Vault: {e}")
        raise

@app.route(route="documents", methods=["POST"])
@app.durable_client_input(client_name="client")
async def upload_document(req: func.HttpRequest, client) -> func.HttpResponse:
    """HTTP starter function for document upload"""
    try:
        tenant_id = req.headers.get('x-tenant-id')
        user_id = req.headers.get('x-user-id')
        
        if not tenant_id or not user_id:
            return func.HttpResponse(
                json.dumps({"error": "Missing x-tenant-id or x-user-id headers"}),
                status_code=400,
                mimetype="application/json"
            )
        
        file_data = None
        file_name = None
        
        if req.files:
            file = req.files.get('file')
            if file:
                file_data = file.read()
                file_name = file.filename
        else:
            try:
                body = req.get_json()
                if body and 'fileUrl' in body:
                    response = requests.get(body['fileUrl'])
                    response.raise_for_status()
                    file_data = response.content
                    file_name = body.get('fileName', 'uploaded_file')
            except Exception as e:
                logging.error(f"Failed to process file URL: {e}")
                return func.HttpResponse(
                    json.dumps({"error": "Failed to process file"}),
                    status_code=400,
                    mimetype="application/json"
                )
        
        if not file_data:
            return func.HttpResponse(
                json.dumps({"error": "No file provided"}),
                status_code=400,
                mimetype="application/json"
            )
        
        file_hash = hashlib.sha256(file_data).hexdigest()
        
        cosmos_client = get_cosmos_client()
        database = cosmos_client.get_database_client(os.environ.get('COSMOS_DB'))
        container = database.get_container_client(os.environ.get('COSMOS_CONTAINER'))
        
        ten_minutes_ago = datetime.now(timezone.utc).isoformat()
        query = "SELECT * FROM c WHERE c.tenantId = @tenant_id AND c.blobSha256 = @hash AND c.createdAt > @time_threshold"
        parameters = [
            {"name": "@tenant_id", "value": tenant_id},
            {"name": "@hash", "value": file_hash},
            {"name": "@time_threshold", "value": ten_minutes_ago}
        ]
        
        existing_docs = list(container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        
        if existing_docs:
            doc = existing_docs[0]
            return func.HttpResponse(
                json.dumps({
                    "documentId": doc['id'],
                    "resultId": doc.get('resultId'),
                    "status": doc['status']
                }),
                status_code=202,
                mimetype="application/json"
            )
        
        document_id = f"doc_{uuid.uuid4()}"
        blob_name = f"{tenant_id}/{document_id}/{file_name}"
        
        blob_client = get_blob_client()
        container_client = blob_client.get_container_client(os.environ.get('BLOB_CONTAINER'))
        blob_client_instance = container_client.get_blob_client(blob_name)
        
        blob_client_instance.upload_blob(file_data, overwrite=True)
        blob_url = blob_client_instance.url
        
        cosmos_doc = {
            "id": document_id,
            "tenantId": tenant_id,
            "userId": user_id,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "blobUrl": blob_url,
            "blobSha256": file_hash,
            "analyzerId": os.environ.get('ANALYZER_ID', 'my-receipts'),
            "resultId": None,
            "status": "submitted",
            "warnings": [],
            "error": None,
            "result": None,
            "extracted": {
                "VendorName": None,
                "Items": []
            },
            "ttl": None
        }
        
        container.create_item(body=cosmos_doc)
        
        analyzer_endpoint = os.environ.get('ANALYZER_ENDPOINT')
        analyzer_key = get_analyzer_key()
        analyzer_id = os.environ.get('ANALYZER_ID')
        
        analyze_url = f"{analyzer_endpoint}/documentintelligence/documentModels/{analyzer_id}:analyze"
        headers = {
            "Ocp-Apim-Subscription-Key": analyzer_key,
            "Content-Type": "application/json"
        }
        
        analyze_payload = {
            "urlSource": blob_url
        }
        
        response = requests.post(analyze_url, headers=headers, json=analyze_payload)
        
        if response.status_code == 202:
            operation_location = response.headers.get('Operation-Location')
            result_id = operation_location.split('/')[-1] if operation_location else None
            
            cosmos_doc['resultId'] = result_id
            cosmos_doc['status'] = 'running'
            container.replace_item(item=document_id, body=cosmos_doc)
            
            instance_id = f"{tenant_id}:{document_id}"
            orchestration_input = {
                "cosmosId": document_id,
                "tenantId": tenant_id,
                "resultId": result_id
            }
            
            await client.start_new("document_orchestrator", instance_id, orchestration_input)
            
            return func.HttpResponse(
                json.dumps({
                    "documentId": document_id,
                    "resultId": result_id,
                    "status": "running"
                }),
                status_code=202,
                mimetype="application/json"
            )
        else:
            cosmos_doc['status'] = 'failed'
            cosmos_doc['error'] = f"Failed to start analysis: {response.text}"
            container.replace_item(item=document_id, body=cosmos_doc)
            
            return func.HttpResponse(
                json.dumps({
                    "documentId": document_id,
                    "status": "failed",
                    "error": "Failed to start analysis"
                }),
                status_code=500,
                mimetype="application/json"
            )
            
    except Exception as e:
        logging.error(f"Error in upload_document: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="documents/{documentId}", methods=["GET"])
async def get_document(req: func.HttpRequest) -> func.HttpResponse:
    """Get document status and results"""
    try:
        document_id = req.route_params.get('documentId')
        
        cosmos_client = get_cosmos_client()
        database = cosmos_client.get_database_client(os.environ.get('COSMOS_DB'))
        container = database.get_container_client(os.environ.get('COSMOS_CONTAINER'))
        
        try:
            document = container.read_item(item=document_id, partition_key=document_id.split('_')[0])
            return func.HttpResponse(
                json.dumps(document, default=str),
                status_code=200,
                mimetype="application/json"
            )
        except Exception:
            return func.HttpResponse(
                json.dumps({"error": "Document not found"}),
                status_code=404,
                mimetype="application/json"
            )
            
    except Exception as e:
        logging.error(f"Error in get_document: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="documents", methods=["GET"])
async def list_documents(req: func.HttpRequest) -> func.HttpResponse:
    """List documents for a tenant"""
    try:
        tenant_id = req.headers.get('x-tenant-id')
        if not tenant_id:
            return func.HttpResponse(
                json.dumps({"error": "Missing x-tenant-id header"}),
                status_code=400,
                mimetype="application/json"
            )
        
        status_filter = req.params.get('status')
        page = int(req.params.get('page', 1))
        page_size = int(req.params.get('pageSize', 20))
        
        cosmos_client = get_cosmos_client()
        database = cosmos_client.get_database_client(os.environ.get('COSMOS_DB'))
        container = database.get_container_client(os.environ.get('COSMOS_CONTAINER'))
        
        query = "SELECT * FROM c WHERE c.tenantId = @tenant_id"
        parameters = [{"name": "@tenant_id", "value": tenant_id}]
        
        if status_filter:
            query += " AND c.status = @status"
            parameters.append({"name": "@status", "value": status_filter})
        
        query += " ORDER BY c.createdAt DESC"
        
        items = list(container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_items = items[start_idx:end_idx]
        
        return func.HttpResponse(
            json.dumps({
                "documents": paginated_items,
                "total": len(items),
                "page": page,
                "pageSize": page_size,
                "totalPages": (len(items) + page_size - 1) // page_size
            }, default=str),
            status_code=200,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error in list_documents: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="documents/batch", methods=["POST"])
@app.durable_client_input(client_name="client")
async def batch_upload(req: func.HttpRequest, client) -> func.HttpResponse:
    """Batch upload multiple documents"""
    try:
        tenant_id = req.headers.get('x-tenant-id')
        user_id = req.headers.get('x-user-id')
        
        if not tenant_id or not user_id:
            return func.HttpResponse(
                json.dumps({"error": "Missing x-tenant-id or x-user-id headers"}),
                status_code=400,
                mimetype="application/json"
            )
        
        quota_entity_id = df.EntityId("QuotaEntity", f"Quota/{tenant_id}")
        quota_state = await client.read_entity_state(quota_entity_id)
        
        current_inflight = quota_state.entity_state.get('inflight', 0) if quota_state.entity_state else 0
        limit = quota_state.entity_state.get('limit', 10) if quota_state.entity_state else 10
        
        files = req.files
        if len(files) + current_inflight > limit:
            return func.HttpResponse(
                json.dumps({
                    "error": "Quota limit exceeded",
                    "current": current_inflight,
                    "limit": limit,
                    "requested": len(files)
                }),
                status_code=429,
                mimetype="application/json"
            )
        
        batch_id = str(uuid.uuid4())
        instance_id = f"{tenant_id}:batch:{batch_id}"
        
        file_list = []
        for file_key in files:
            file = files[file_key]
            file_list.append({
                "fileName": file.filename,
                "fileData": file.read().hex()  # Convert to hex for JSON serialization
            })
        
        orchestration_input = {
            "tenantId": tenant_id,
            "userId": user_id,
            "files": file_list,
            "batchId": batch_id
        }
        
        await client.start_new("batch_orchestrator", instance_id, orchestration_input)
        
        return func.HttpResponse(
            json.dumps({
                "batchId": batch_id,
                "status": "processing",
                "fileCount": len(file_list)
            }),
            status_code=202,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error in batch_upload: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Internal server error"}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="health", methods=["GET"])
async def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dependencies": {}
        }
        
        try:
            cosmos_client = get_cosmos_client()
            database = cosmos_client.get_database_client(os.environ.get('COSMOS_DB'))
            database.read()
            health_status["dependencies"]["cosmosdb"] = "healthy"
        except Exception as e:
            health_status["dependencies"]["cosmosdb"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"
        
        try:
            blob_client = get_blob_client()
            container_client = blob_client.get_container_client(os.environ.get('BLOB_CONTAINER'))
            container_client.get_container_properties()
            health_status["dependencies"]["blobstorage"] = "healthy"
        except Exception as e:
            health_status["dependencies"]["blobstorage"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"
        
        try:
            secret_client = get_secret_client()
            secret_client.get_secret("ANALYZER-KEY")
            health_status["dependencies"]["keyvault"] = "healthy"
        except Exception as e:
            health_status["dependencies"]["keyvault"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"
        
        status_code = 200 if health_status["status"] == "healthy" else 503
        
        return func.HttpResponse(
            json.dumps(health_status),
            status_code=status_code,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error in health_check: {e}")
        return func.HttpResponse(
            json.dumps({
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }),
            status_code=503,
            mimetype="application/json"
        )
