import azure.durable_functions as df
import logging
import json
import os
import hashlib
import uuid
from datetime import datetime, timezone
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient
import requests

def get_cosmos_client():
    cosmos_url = os.environ.get('COSMOS_URL')
    credential = DefaultAzureCredential()
    return CosmosClient(cosmos_url, credential=credential)

def get_secret_client():
    key_vault_uri = os.environ.get('KEY_VAULT_URI')
    credential = DefaultAzureCredential()
    return SecretClient(vault_url=key_vault_uri, credential=credential)

def get_blob_client():
    storage_connection_string = os.environ.get('AzureWebJobsStorage')
    return BlobServiceClient.from_connection_string(storage_connection_string)

@df.activity_function
def poll_status(result_id: str) -> dict:
    """Poll Azure AI Content Understanding for analysis status"""
    try:
        analyzer_endpoint = os.environ.get('ANALYZER_ENDPOINT')
        
        secret_client = get_secret_client()
        analyzer_key = secret_client.get_secret("ANALYZER-KEY").value
        
        status_url = f"{analyzer_endpoint}/documentintelligence/documentModels/my-receipts/analyzeResults/{result_id}"
        headers = {
            "Ocp-Apim-Subscription-Key": analyzer_key
        }
        
        response = requests.get(status_url, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            status = result.get('status', 'unknown')
            
            if status == 'succeeded':
                return {
                    "status": "succeeded",
                    "result": result
                }
            elif status == 'failed':
                return {
                    "status": "failed",
                    "error": result.get('error', 'Unknown error')
                }
            else:
                return {
                    "status": "running"
                }
        else:
            logging.error(f"Failed to poll status: {response.status_code} - {response.text}")
            return {
                "status": "failed",
                "error": f"HTTP {response.status_code}: {response.text}"
            }
            
    except Exception as e:
        logging.error(f"Error in poll_status: {e}")
        return {
            "status": "failed",
            "error": str(e)
        }

@df.activity_function
def persist_results(input_data: dict) -> dict:
    """Persist analysis results to Cosmos DB"""
    try:
        cosmos_id = input_data['cosmosId']
        result = input_data['result']
        
        cosmos_client = get_cosmos_client()
        database = cosmos_client.get_database_client(os.environ.get('COSMOS_DB'))
        container = database.get_container_client(os.environ.get('COSMOS_CONTAINER'))
        
        document = container.read_item(item=cosmos_id, partition_key=cosmos_id.split('_')[0])
        
        extracted_data = {
            "VendorName": None,
            "Items": []
        }
        
        if 'analyzeResult' in result and 'documents' in result['analyzeResult']:
            documents = result['analyzeResult']['documents']
            if documents:
                doc = documents[0]
                fields = doc.get('fields', {})
                
                if 'VendorName' in fields:
                    vendor_field = fields['VendorName']
                    if vendor_field.get('type') == 'string':
                        extracted_data['VendorName'] = vendor_field.get('valueString')
                
                if 'Items' in fields:
                    items_field = fields['Items']
                    if items_field.get('type') == 'array':
                        items = items_field.get('valueArray', [])
                        for item in items:
                            if item.get('type') == 'object':
                                item_obj = item.get('valueObject', {})
                                extracted_item = {}
                                
                                for field_name in ['Description', 'Quantity', 'UnitPrice', 'TotalPrice']:
                                    if field_name in item_obj:
                                        field_data = item_obj[field_name]
                                        if field_data.get('type') == 'string':
                                            extracted_item[field_name] = field_data.get('valueString')
                                        elif field_data.get('type') == 'number':
                                            extracted_item[field_name] = field_data.get('valueNumber')
                                
                                if extracted_item:
                                    extracted_data['Items'].append(extracted_item)
        
        document['status'] = 'succeeded'
        document['result'] = result
        document['extracted'] = extracted_data
        
        container.replace_item(item=cosmos_id, body=document)
        
        logging.info(f"Successfully persisted results for document {cosmos_id}")
        return {"success": True}
        
    except Exception as e:
        logging.error(f"Error in persist_results: {e}")
        return {"success": False, "error": str(e)}

@df.activity_function
def mark_failed(input_data: dict) -> dict:
    """Mark document as failed in Cosmos DB"""
    try:
        cosmos_id = input_data['cosmosId']
        reason = input_data['reason']
        
        cosmos_client = get_cosmos_client()
        database = cosmos_client.get_database_client(os.environ.get('COSMOS_DB'))
        container = database.get_container_client(os.environ.get('COSMOS_CONTAINER'))
        
        document = container.read_item(item=cosmos_id, partition_key=cosmos_id.split('_')[0])
        
        document['status'] = 'failed'
        document['error'] = reason
        
        container.replace_item(item=cosmos_id, body=document)
        
        logging.info(f"Marked document {cosmos_id} as failed: {reason}")
        return {"success": True}
        
    except Exception as e:
        logging.error(f"Error in mark_failed: {e}")
        return {"success": False, "error": str(e)}

@df.activity_function
def compute_blob_hash(blob_url: str) -> str:
    """Compute SHA256 hash of blob content"""
    try:
        blob_client = get_blob_client()
        
        url_parts = blob_url.split('/')
        container_name = url_parts[-3]
        blob_name = '/'.join(url_parts[-2:])
        
        blob_client_instance = blob_client.get_blob_client(container=container_name, blob=blob_name)
        blob_data = blob_client_instance.download_blob().readall()
        
        return hashlib.sha256(blob_data).hexdigest()
        
    except Exception as e:
        logging.error(f"Error computing blob hash: {e}")
        raise

@df.activity_function
def process_single_file(input_data: dict) -> dict:
    """Process a single file in batch upload"""
    try:
        tenant_id = input_data['tenantId']
        user_id = input_data['userId']
        file_name = input_data['fileName']
        file_data_hex = input_data['fileData']
        batch_id = input_data['batchId']
        
        file_data = bytes.fromhex(file_data_hex)
        
        file_hash = hashlib.sha256(file_data).hexdigest()
        
        document_id = f"doc_{uuid.uuid4()}"
        blob_name = f"{tenant_id}/{document_id}/{file_name}"
        
        blob_client = get_blob_client()
        container_client = blob_client.get_container_client(os.environ.get('BLOB_CONTAINER'))
        blob_client_instance = container_client.get_blob_client(blob_name)
        
        blob_client_instance.upload_blob(file_data, overwrite=True)
        blob_url = blob_client_instance.url
        
        cosmos_client = get_cosmos_client()
        database = cosmos_client.get_database_client(os.environ.get('COSMOS_DB'))
        container = database.get_container_client(os.environ.get('COSMOS_CONTAINER'))
        
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
            "ttl": None,
            "batchId": batch_id
        }
        
        container.create_item(body=cosmos_doc)
        
        return {
            "documentId": document_id,
            "fileName": file_name,
            "status": "submitted"
        }
        
    except Exception as e:
        logging.error(f"Error processing single file: {e}")
        return {
            "fileName": input_data.get('fileName', 'unknown'),
            "status": "failed",
            "error": str(e)
        }
