from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
import uuid

class StorageInfo(BaseModel):
    container: str
    blobPath: str
    etag: str

class ShipmentDocumentMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shipmentId: str
    filename: str
    contentType: str
    sizeBytes: int
    pageCount: int = 0
    documentType: Optional[str] = None
    status: Literal["Processing", "Processed", "Failed"] = "Processing"
    isDangerousGoods: bool = False
    confidencePercentage: Optional[float] = None
    transportType: Optional[str] = None
    branch: str = "SLC"
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    storage: StorageInfo

class ShipmentDocumentUploadResponse(BaseModel):
    id: str
    shipmentId: str
    filename: str
    status: str
    message: str

class ShipmentDocumentListResponse(BaseModel):
    documents: List[ShipmentDocumentMetadata]
    total: int
    page: int
    pageSize: int
    totalPages: int

class ShipmentDocumentDownloadResponse(BaseModel):
    downloadUrl: str
    expiresAt: datetime

class ShipmentDocumentFilters(BaseModel):
    shipmentId: Optional[str] = None
    status: Optional[str] = None
    isDangerousGoods: Optional[bool] = None
    confidenceMin: Optional[float] = Field(None, ge=0, le=100)
    confidenceMax: Optional[float] = Field(None, ge=0, le=100)
    transportType: Optional[str] = None
    branch: Optional[str] = None
    documentType: Optional[str] = None
    from_date: Optional[datetime] = Field(None, alias="from")
    to_date: Optional[datetime] = Field(None, alias="to")
    page: int = 1
    pageSize: int = 25
    sortBy: str = "uploadedAt"
    sortDir: Literal["asc", "desc"] = "desc"

DocumentMetadata = ShipmentDocumentMetadata
DocumentUploadResponse = ShipmentDocumentUploadResponse
DocumentListResponse = ShipmentDocumentListResponse
DocumentDownloadResponse = ShipmentDocumentDownloadResponse
DocumentFilters = ShipmentDocumentFilters
