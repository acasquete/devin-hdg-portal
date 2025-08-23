from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
import logging
import uuid
from datetime import datetime

from .models import (
    DocumentMetadata, DocumentUploadResponse, DocumentListResponse, 
    DocumentDownloadResponse, DocumentFilters
)
from .services import storage_service
from .config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Document Management API",
    description="""
    A comprehensive document management system with Azure Storage and Cosmos DB integration.
    
    
    * **Upload Documents**: Store files in Azure Storage with metadata in Cosmos DB
    * **List Documents**: Query documents with filters and pagination
    * **Download Documents**: Generate temporary download URLs
    * **Delete Documents**: Remove documents from both storage and database
    * **API Key Authentication**: Secure access with API keys
    
    
    All endpoints require an API key in the `X-API-Key` header.
    
    
    Supported file types: PDF, PNG, JPG, JPEG, TIFF
    Maximum file size: 10MB per file
    """,
    version="1.0.0",
    contact={
        "name": "Document Management API",
        "email": "support@example.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

@app.get("/healthz", tags=["Health"])
async def healthz():
    """
    Health check endpoint to verify the API is running.
    
    Returns the current status and timestamp.
    """
    return {"status": "ok"}

@app.post("/api/documents", response_model=DocumentUploadResponse, tags=["Documents"])
async def upload_document(
    file: UploadFile = File(..., description="Document file to upload"),
    uploaded_by: str = Query(..., description="Email of the user uploading the document"),
    tags: Optional[str] = Query(None, description="Comma-separated tags for the document"),
    api_key: str = Depends(verify_api_key)
):
    """Upload a document to Azure Storage and store metadata in Cosmos DB"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Document upload started: {file.filename}")
    
    try:
        if file.content_type not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file.content_type} not allowed. Allowed types: {settings.ALLOWED_FILE_TYPES}"
            )
        
        file_content = await file.read()
        
        file_size_mb = len(file_content) / (1024 * 1024)
        if file_size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"File size {file_size_mb:.2f}MB exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        metadata = await storage_service.upload_document(
            file_content=file_content,
            filename=file.filename,
            content_type=file.content_type,
            uploaded_by=uploaded_by
        )
        
        metadata.tags = tag_list
        
        logger.info(f"[{request_id}] Document uploaded successfully: {metadata.id}")
        
        return DocumentUploadResponse(
            id=metadata.id,
            filename=metadata.filename,
            status="success",
            message="Document uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during upload")

@app.get("/api/documents", response_model=DocumentListResponse, tags=["Documents"])
async def list_documents(
    q: Optional[str] = Query(None, description="Search query for filename and tags"),
    tag: Optional[str] = Query(None, description="Filter by specific tag"),
    contentType: Optional[str] = Query(None, description="Filter by content type (e.g., application/pdf)"),
    status: Optional[str] = Query(None, description="Filter by status (stored, processing, failed)"),
    from_date: Optional[datetime] = Query(None, alias="from", description="Filter documents uploaded from this date"),
    to_date: Optional[datetime] = Query(None, alias="to", description="Filter documents uploaded to this date"),
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    pageSize: int = Query(25, ge=1, le=100, description="Number of documents per page (max 100)"),
    sortBy: str = Query("uploadedAt", description="Field to sort by (uploadedAt, filename, sizeBytes)"),
    sortDir: str = Query("desc", regex="^(asc|desc)$", description="Sort direction (asc or desc)"),
    api_key: str = Depends(verify_api_key)
):
    """List documents with filtering and pagination"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Document list requested")
    
    try:
        filters = DocumentFilters(
            q=q,
            tag=tag,
            contentType=contentType,
            status=status,
            from_date=from_date,
            to_date=to_date,
            page=page,
            pageSize=pageSize,
            sortBy=sortBy,
            sortDir=sortDir
        )
        
        documents, total = await storage_service.list_documents(filters)
        total_pages = (total + pageSize - 1) // pageSize
        
        logger.info(f"[{request_id}] Found {total} documents, returning page {page}")
        
        return DocumentListResponse(
            documents=documents,
            total=total,
            page=page,
            pageSize=pageSize,
            totalPages=total_pages
        )
        
    except Exception as e:
        logger.error(f"[{request_id}] List failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during list")

@app.get("/api/documents/{document_id}", response_model=DocumentMetadata, tags=["Documents"])
async def get_document(
    document_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get document metadata by ID"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Document detail requested: {document_id}")
    
    try:
        metadata = await storage_service.get_document(document_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.info(f"[{request_id}] Document found: {document_id}")
        return metadata
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Get document failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/documents/{document_id}/download", response_model=DocumentDownloadResponse, tags=["Documents"])
async def get_download_url(
    document_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get temporary download URL for document"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Download URL requested: {document_id}")
    
    try:
        download_url = await storage_service.get_download_url(document_id)
        if not download_url:
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.info(f"[{request_id}] Download URL generated: {document_id}")
        
        return DocumentDownloadResponse(
            downloadUrl=download_url,
            expiresAt=datetime.utcnow().replace(hour=datetime.utcnow().hour + 1)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Download URL generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/api/documents/{document_id}", tags=["Documents"])
async def delete_document(
    document_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Delete document from storage and database"""
    request_id = str(uuid.uuid4())
    logger.info(f"[{request_id}] Document deletion requested: {document_id}")
    
    try:
        success = await storage_service.delete_document(document_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        logger.info(f"[{request_id}] Document deleted successfully: {document_id}")
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] Delete failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
