import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
    AZURE_STORAGE_CONTAINER_NAME = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "documents")
    
    AZURE_COSMOS_ENDPOINT = os.getenv("AZURE_COSMOS_ENDPOINT")
    AZURE_COSMOS_KEY = os.getenv("AZURE_COSMOS_KEY")
    AZURE_COSMOS_DATABASE_NAME = os.getenv("AZURE_COSMOS_DATABASE_NAME", "documents")
    AZURE_COSMOS_CONTAINER_NAME = os.getenv("AZURE_COSMOS_CONTAINER_NAME", "metadata")
    
    API_KEY = os.getenv("API_KEY", "dev-api-key-change-in-production")
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    ALLOWED_FILE_TYPES = os.getenv("ALLOWED_FILE_TYPES", "application/pdf,image/png,image/jpeg,image/tiff").split(",")
    
    USE_MOCK_STORAGE = not bool(AZURE_STORAGE_CONNECTION_STRING and AZURE_COSMOS_ENDPOINT)

settings = Settings()
