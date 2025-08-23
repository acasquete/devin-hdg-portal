import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
from azure.cosmos import CosmosClient, PartitionKey
from azure.core.exceptions import ResourceNotFoundError
import logging
from .config import settings
from .models import DocumentMetadata, StorageInfo, IngestionInfo, DocumentFilters

logger = logging.getLogger(__name__)

class MockStorageService:
    """Mock storage service for development when Azure credentials are not available"""
    
    def __init__(self):
        self.documents: Dict[str, DocumentMetadata] = {}
        self.blobs: Dict[str, bytes] = {}
    
    async def upload_document(self, file_content: bytes, filename: str, content_type: str, uploaded_by: str) -> DocumentMetadata:
        doc_id = str(uuid.uuid4())
        now = datetime.utcnow()
        blob_path = f"{now.year}/{now.month:02d}/{now.day:02d}/{filename}"
        
        self.blobs[blob_path] = file_content
        
        metadata = DocumentMetadata(
            id=doc_id,
            filename=filename,
            contentType=content_type,
            sizeBytes=len(file_content),
            storage=StorageInfo(
                container="documents",
                blobPath=blob_path,
                etag=f"mock-etag-{doc_id}"
            ),
            ingestion=IngestionInfo(
                uploadedBy=uploaded_by,
                uploadedAt=now
            ),
            tags=[],
            status="stored"
        )
        
        self.documents[doc_id] = metadata
        return metadata
    
    async def get_document(self, doc_id: str) -> Optional[DocumentMetadata]:
        return self.documents.get(doc_id)
    
    async def list_documents(self, filters: DocumentFilters) -> tuple[List[DocumentMetadata], int]:
        docs = list(self.documents.values())
        
        if filters.q:
            docs = [d for d in docs if filters.q.lower() in d.filename.lower() or 
                   any(filters.q.lower() in tag.lower() for tag in d.tags)]
        
        if filters.contentType:
            docs = [d for d in docs if d.contentType == filters.contentType]
        
        if filters.status:
            docs = [d for d in docs if d.status == filters.status]
        
        if filters.tag:
            docs = [d for d in docs if filters.tag in d.tags]
        
        if filters.from_date:
            docs = [d for d in docs if d.ingestion.uploadedAt >= filters.from_date]
        
        if filters.to_date:
            docs = [d for d in docs if d.ingestion.uploadedAt <= filters.to_date]
        
        reverse = filters.sortDir == "desc"
        if filters.sortBy == "uploadedAt":
            docs.sort(key=lambda x: x.ingestion.uploadedAt, reverse=reverse)
        elif filters.sortBy == "filename":
            docs.sort(key=lambda x: x.filename, reverse=reverse)
        elif filters.sortBy == "sizeBytes":
            docs.sort(key=lambda x: x.sizeBytes, reverse=reverse)
        
        total = len(docs)
        
        start = (filters.page - 1) * filters.pageSize
        end = start + filters.pageSize
        docs = docs[start:end]
        
        return docs, total
    
    async def get_download_url(self, doc_id: str) -> Optional[str]:
        if doc_id not in self.documents:
            return None
        return f"http://localhost:8000/api/documents/{doc_id}/download-mock"
    
    async def delete_document(self, doc_id: str) -> bool:
        if doc_id not in self.documents:
            return False
        
        metadata = self.documents[doc_id]
        if metadata.storage.blobPath in self.blobs:
            del self.blobs[metadata.storage.blobPath]
        
        del self.documents[doc_id]
        return True

class AzureStorageService:
    """Azure Storage and Cosmos DB service"""
    
    def __init__(self):
        self.blob_service = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
        self.cosmos_client = CosmosClient(settings.AZURE_COSMOS_ENDPOINT, settings.AZURE_COSMOS_KEY)
        self.database = self.cosmos_client.get_database_client(settings.AZURE_COSMOS_DATABASE_NAME)
        self.container = self.database.get_container_client(settings.AZURE_COSMOS_CONTAINER_NAME)
    
    async def upload_document(self, file_content: bytes, filename: str, content_type: str, uploaded_by: str) -> DocumentMetadata:
        doc_id = str(uuid.uuid4())
        now = datetime.utcnow()
        blob_path = f"{now.year}/{now.month:02d}/{now.day:02d}/{filename}"
        
        blob_client = self.blob_service.get_blob_client(
            container=settings.AZURE_STORAGE_CONTAINER_NAME,
            blob=blob_path
        )
        
        upload_result = blob_client.upload_blob(
            file_content,
            content_type=content_type,
            overwrite=True
        )
        
        metadata = DocumentMetadata(
            id=doc_id,
            filename=filename,
            contentType=content_type,
            sizeBytes=len(file_content),
            storage=StorageInfo(
                container=settings.AZURE_STORAGE_CONTAINER_NAME,
                blobPath=blob_path,
                etag=upload_result['etag']
            ),
            ingestion=IngestionInfo(
                uploadedBy=uploaded_by,
                uploadedAt=now
            ),
            tags=[],
            status="stored"
        )
        
        self.container.create_item(metadata.model_dump())
        
        return metadata
    
    async def get_document(self, doc_id: str) -> Optional[DocumentMetadata]:
        try:
            item = self.container.read_item(item=doc_id, partition_key=doc_id)
            return DocumentMetadata(**item)
        except ResourceNotFoundError:
            return None
    
    async def list_documents(self, filters: DocumentFilters) -> tuple[List[DocumentMetadata], int]:
        query = "SELECT * FROM c WHERE 1=1"
        parameters = []
        
        if filters.q:
            query += " AND (CONTAINS(LOWER(c.filename), @q) OR EXISTS(SELECT VALUE t FROM t IN c.tags WHERE CONTAINS(LOWER(t), @q)))"
            parameters.append({"name": "@q", "value": filters.q.lower()})
        
        if filters.contentType:
            query += " AND c.contentType = @contentType"
            parameters.append({"name": "@contentType", "value": filters.contentType})
        
        if filters.status:
            query += " AND c.status = @status"
            parameters.append({"name": "@status", "value": filters.status})
        
        if filters.tag:
            query += " AND ARRAY_CONTAINS(c.tags, @tag)"
            parameters.append({"name": "@tag", "value": filters.tag})
        
        if filters.from_date:
            query += " AND c.ingestion.uploadedAt >= @fromDate"
            parameters.append({"name": "@fromDate", "value": filters.from_date.isoformat()})
        
        if filters.to_date:
            query += " AND c.ingestion.uploadedAt <= @toDate"
            parameters.append({"name": "@toDate", "value": filters.to_date.isoformat()})
        
        if filters.sortBy == "uploadedAt":
            query += f" ORDER BY c.ingestion.uploadedAt {filters.sortDir.upper()}"
        elif filters.sortBy == "filename":
            query += f" ORDER BY c.filename {filters.sortDir.upper()}"
        elif filters.sortBy == "sizeBytes":
            query += f" ORDER BY c.sizeBytes {filters.sortDir.upper()}"
        
        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        
        total = len(items)
        
        start = (filters.page - 1) * filters.pageSize
        end = start + filters.pageSize
        items = items[start:end]
        
        documents = [DocumentMetadata(**item) for item in items]
        return documents, total
    
    async def get_download_url(self, doc_id: str) -> Optional[str]:
        metadata = await self.get_document(doc_id)
        if not metadata:
            return None
        
        sas_token = generate_blob_sas(
            account_name=self.blob_service.account_name,
            container_name=metadata.storage.container,
            blob_name=metadata.storage.blobPath,
            account_key=self.blob_service.credential.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(hours=1)
        )
        
        return f"https://{self.blob_service.account_name}.blob.core.windows.net/{metadata.storage.container}/{metadata.storage.blobPath}?{sas_token}"
    
    async def delete_document(self, doc_id: str) -> bool:
        metadata = await self.get_document(doc_id)
        if not metadata:
            return False
        
        blob_client = self.blob_service.get_blob_client(
            container=metadata.storage.container,
            blob=metadata.storage.blobPath
        )
        
        try:
            blob_client.delete_blob()
        except ResourceNotFoundError:
            logger.warning(f"Blob not found for document {doc_id}")
        
        try:
            self.container.delete_item(item=doc_id, partition_key=doc_id)
            return True
        except ResourceNotFoundError:
            return False

if settings.USE_MOCK_STORAGE:
    storage_service = MockStorageService()
    logger.info("Using mock storage service for development")
else:
    storage_service = AzureStorageService()
    logger.info("Using Azure storage service")
