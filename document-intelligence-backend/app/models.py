from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
import uuid

class StorageInfo(BaseModel):
    container: str
    blobPath: str
    etag: str

class IngestionInfo(BaseModel):
    uploadedBy: str
    uploadedAt: datetime

class DocumentMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    contentType: str
    sizeBytes: int
    storage: StorageInfo
    ingestion: IngestionInfo
    tags: List[str] = Field(default_factory=list)
    status: Literal["stored", "processing", "failed"] = "stored"

class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    message: str

class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]
    total: int
    page: int
    pageSize: int
    totalPages: int

class DocumentDownloadResponse(BaseModel):
    downloadUrl: str
    expiresAt: datetime

class DocumentFilters(BaseModel):
    q: Optional[str] = None
    tag: Optional[str] = None
    contentType: Optional[str] = None
    status: Optional[str] = None
    from_date: Optional[datetime] = Field(None, alias="from")
    to_date: Optional[datetime] = Field(None, alias="to")
    page: int = 1
    pageSize: int = 25
    sortBy: str = "uploadedAt"
    sortDir: Literal["asc", "desc"] = "desc"
