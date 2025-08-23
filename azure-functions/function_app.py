import azure.functions as func
import azure.durable_functions as df
import json
import logging
import os
import uuid
from datetime import datetime
from azure.cosmos import CosmosClient
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

app = df.DFApp(http_auth_level=func.AuthLevel.ANONYMOUS)

cosmos_client = None
cosmos_container = None
document_analysis_client = None

def get_cosmos_container():
    global cosmos_client, cosmos_container
    if cosmos_container is None:
        connection_string = os.environ["COSMOS_CONNECTION_STRING"]
        database_name = os.environ["COSMOS_DATABASE_NAME"]
        container_name = os.environ["COSMOS_CONTAINER_NAME"]
        
        cosmos_client = CosmosClient.from_connection_string(connection_string)
        database = cosmos_client.get_database_client(database_name)
        cosmos_container = database.get_container_client(container_name)
    
    return cosmos_container

def get_document_analysis_client():
    global document_analysis_client
    if document_analysis_client is None:
        endpoint = os.environ["DOCUMENT_INTELLIGENCE_ENDPOINT"]
        key = os.environ["DOCUMENT_INTELLIGENCE_KEY"]
        document_analysis_client = DocumentAnalysisClient(
            endpoint=endpoint, 
            credential=AzureKeyCredential(key)
        )
    
    return document_analysis_client

@app.route(route="documents", methods=["POST"])
@app.blob_output(arg_name="outputblob", path="documents/{rand-guid}", connection="AzureWebJobsStorage")
async def upload_document(req: func.HttpRequest, outputblob: func.Out[bytes]) -> func.HttpResponse:
    logging.info('Document upload request received.')
    
    try:
        files = req.files
        if not files:
            return func.HttpResponse(
                json.dumps({"error": "No file provided"}),
                status_code=400,
                mimetype="application/json"
            )
        
        file = files.get('file')
        if not file:
            return func.HttpResponse(
                json.dumps({"error": "No file with key 'file' found"}),
                status_code=400,
                mimetype="application/json"
            )
        
        file_content = file.read()
        document_id = str(uuid.uuid4())
        
        outputblob.set(file_content)
        
        document_metadata = {
            "id": document_id,
            "sourceFile": file.filename,
            "uploadTimestamp": datetime.utcnow().isoformat(),
            "status": "uploaded",
            "fileSize": len(file_content),
            "contentType": file.content_type or "application/octet-stream"
        }
        
        container = get_cosmos_container()
        container.create_item(document_metadata)
        
        client = df.DurableOrchestrationClient(req)
        instance_id = await client.start_new("document_analysis_orchestrator", None, document_id)
        
        return func.HttpResponse(
            json.dumps({
                "documentId": document_id,
                "status": "uploaded",
                "instanceId": instance_id,
                "message": "Document uploaded successfully and analysis started"
            }),
            status_code=201,
            mimetype="application/json"
        )
        
    except Exception as e:
        logging.error(f"Error uploading document: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": f"Failed to upload document: {str(e)}"}),
            status_code=500,
            mimetype="application/json"
        )

@app.route(route="documents/{id}", methods=["GET"])
async def get_document_status(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Document status request received.')
    
    try:
        document_id = req.route_params.get('id')
        if not document_id:
            return func.HttpResponse(
                json.dumps({"error": "Document ID is required"}),
                status_code=400,
                mimetype="application/json"
            )
        
        container = get_cosmos_container()
        
        try:
            document = container.read_item(item=document_id, partition_key=document_id)
            return func.HttpResponse(
                json.dumps(document),
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
        logging.error(f"Error retrieving document status: {str(e)}")
        return func.HttpResponse(
            json.dumps({"error": f"Failed to retrieve document status: {str(e)}"}),
            status_code=500,
            mimetype="application/json"
        )

@app.orchestration_trigger(context_name="context")
def document_analysis_orchestrator(context: df.DurableOrchestrationContext):
    document_id = context.get_input()
    
    try:
        result = yield context.call_activity("analyze_document_activity", document_id)
        yield context.call_activity("update_document_status_activity", {
            "document_id": document_id,
            "status": "completed",
            "analysis_result": result
        })
        
        return {"status": "completed", "result": result}
        
    except Exception as e:
        yield context.call_activity("update_document_status_activity", {
            "document_id": document_id,
            "status": "failed",
            "error": str(e)
        })
        
        return {"status": "failed", "error": str(e)}

@app.activity_trigger(input_name="document_id")
def analyze_document_activity(document_id: str):
    logging.info(f'Analyzing document: {document_id}')
    
    try:
        container = get_cosmos_container()
        document = container.read_item(item=document_id, partition_key=document_id)
        
        container.upsert_item({
            **document,
            "status": "analyzing",
            "analysisStartTime": datetime.utcnow().isoformat()
        })
        
        storage_connection_string = os.environ["STORAGE_CONNECTION_STRING"]
        storage_container_name = os.environ["STORAGE_CONTAINER_NAME"]
        
        blob_url = f"https://{storage_connection_string.split('AccountName=')[1].split(';')[0]}.blob.core.windows.net/{storage_container_name}/{document_id}"
        
        client = get_document_analysis_client()
        
        poller = client.begin_analyze_document_from_url("prebuilt-document", blob_url)
        result = poller.result()
        
        extracted_fields = {}
        confidence_scores = []
        
        for page in result.pages:
            for line in page.lines:
                if line.content and line.confidence:
                    confidence_scores.append(line.confidence)
        
        for kv_pair in result.key_value_pairs:
            if kv_pair.key and kv_pair.value:
                key_text = kv_pair.key.content if kv_pair.key.content else "unknown"
                value_text = kv_pair.value.content if kv_pair.value.content else ""
                extracted_fields[key_text] = value_text
        
        dangerous_goods_keywords = [
            "dangerous", "hazardous", "flammable", "toxic", "corrosive", 
            "explosive", "radioactive", "UN", "class 3", "class 8", "class 9"
        ]
        
        full_text = " ".join([page.lines[i].content for page in result.pages for i in range(len(page.lines))]).lower()
        dangerous_goods_detected = any(keyword in full_text for keyword in dangerous_goods_keywords)
        
        hazard_codes = []
        import re
        un_pattern = r'UN\d{4}'
        hazard_codes = list(set(re.findall(un_pattern, full_text.upper())))
        
        analysis_result = {
            "extractedFields": extracted_fields,
            "dangerousGoods": dangerous_goods_detected,
            "hazardCodes": hazard_codes,
            "confidence": sum(confidence_scores) / len(confidence_scores) * 100 if confidence_scores else 0,
            "pageCount": len(result.pages),
            "analysisCompletedTime": datetime.utcnow().isoformat()
        }
        
        return analysis_result
        
    except Exception as e:
        logging.error(f"Error analyzing document {document_id}: {str(e)}")
        raise

@app.activity_trigger(input_name="update_data")
def update_document_status_activity(update_data: dict):
    logging.info(f'Updating document status: {update_data["document_id"]}')
    
    try:
        container = get_cosmos_container()
        document_id = update_data["document_id"]
        
        document = container.read_item(item=document_id, partition_key=document_id)
        
        document["status"] = update_data["status"]
        document["lastUpdated"] = datetime.utcnow().isoformat()
        
        if "analysis_result" in update_data:
            document.update(update_data["analysis_result"])
        
        if "error" in update_data:
            document["error"] = update_data["error"]
        
        container.upsert_item(document)
        
        return {"success": True}
        
    except Exception as e:
        logging.error(f"Error updating document status: {str(e)}")
        raise

@app.route(route="health", methods=["GET"])
async def health_check(req: func.HttpRequest) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({"status": "healthy", "timestamp": datetime.utcnow().isoformat()}),
        status_code=200,
        mimetype="application/json"
    )
