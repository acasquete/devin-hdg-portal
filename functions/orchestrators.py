import azure.durable_functions as df
import logging
import json
import os
from datetime import datetime, timezone, timedelta
from azure.cosmos import CosmosClient
from azure.identity import DefaultAzureCredential
import requests

def get_cosmos_client():
    cosmos_url = os.environ.get('COSMOS_URL')
    credential = DefaultAzureCredential()
    return CosmosClient(cosmos_url, credential=credential)

@df.orchestrator_function
def document_orchestrator(context: df.DurableOrchestrationContext):
    """Main orchestrator for document processing"""
    input_data = context.get_input()
    cosmos_id = input_data['cosmosId']
    tenant_id = input_data['tenantId']
    result_id = input_data['resultId']
    
    quota_entity_id = df.EntityId("QuotaEntity", f"Quota/{tenant_id}")
    yield context.call_entity(quota_entity_id, "try_acquire")
    
    try:
        max_attempts = 180  # 30 minutes with increasing intervals
        attempt = 0
        backoff_seconds = 1
        
        while attempt < max_attempts:
            status_result = yield context.call_activity("poll_status", result_id)
            
            if status_result['status'] == 'succeeded':
                yield context.call_activity("persist_results", {
                    "cosmosId": cosmos_id,
                    "result": status_result['result']
                })
                break
            elif status_result['status'] == 'failed':
                yield context.call_activity("mark_failed", {
                    "cosmosId": cosmos_id,
                    "reason": status_result.get('error', 'Analysis failed')
                })
                break
            elif status_result['status'] == 'running':
                attempt += 1
                yield context.create_timer(context.current_utc_datetime + timedelta(seconds=backoff_seconds))
                
                backoff_seconds = min(backoff_seconds * 1.5, 5)
            else:
                attempt += 1
                yield context.create_timer(context.current_utc_datetime + timedelta(seconds=backoff_seconds))
        
        if attempt >= max_attempts:
            yield context.call_activity("mark_failed", {
                "cosmosId": cosmos_id,
                "reason": "Analysis timeout after 30 minutes"
            })
    
    finally:
        yield context.call_entity(quota_entity_id, "release")

@df.orchestrator_function
def batch_orchestrator(context: df.DurableOrchestrationContext):
    """Orchestrator for batch document processing"""
    input_data = context.get_input()
    tenant_id = input_data['tenantId']
    user_id = input_data['userId']
    files = input_data['files']
    batch_id = input_data['batchId']
    
    max_concurrent = 5
    tasks = []
    
    for i in range(0, len(files), max_concurrent):
        batch_files = files[i:i + max_concurrent]
        
        parallel_tasks = []
        for file_info in batch_files:
            task_input = {
                "tenantId": tenant_id,
                "userId": user_id,
                "fileName": file_info['fileName'],
                "fileData": file_info['fileData'],
                "batchId": batch_id
            }
            parallel_tasks.append(context.call_activity("process_single_file", task_input))
        
        batch_results = yield context.task_all(parallel_tasks)
        tasks.extend(batch_results)
    
    return {
        "batchId": batch_id,
        "totalFiles": len(files),
        "results": tasks
    }
