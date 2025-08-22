import pytest
import json
from unittest.mock import Mock, patch, AsyncMock
from azure.functions import HttpRequest, HttpResponse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from function_app import upload_document, get_document, list_documents, health_check

class TestFunctionApp:
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test the health check endpoint"""
        req = HttpRequest(
            method='GET',
            url='http://localhost:7071/api/health',
            headers={},
            body=b'',
            params={}
        )
        
        with patch('function_app.get_cosmos_client') as mock_cosmos, \
             patch('function_app.get_blob_client') as mock_blob:
            
            mock_cosmos.return_value = Mock()
            mock_blob.return_value = Mock()
            
            response = await health_check(req)
            
            assert response.status_code == 200
            response_data = json.loads(response.get_body())
            assert response_data['status'] == 'healthy'
            assert 'cosmos' in response_data['dependencies']
            assert 'blob_storage' in response_data['dependencies']

    @pytest.mark.asyncio
    async def test_upload_document_missing_headers(self):
        """Test upload document with missing required headers"""
        req = HttpRequest(
            method='POST',
            url='http://localhost:7071/api/documents',
            headers={},
            body=b'test file content',
            params={}
        )
        
        response = await upload_document(req)
        
        assert response.status_code == 400
        response_data = json.loads(response.get_body())
        assert 'error' in response_data

    @pytest.mark.asyncio
    async def test_get_document_not_found(self):
        """Test get document with non-existent document ID"""
        req = HttpRequest(
            method='GET',
            url='http://localhost:7071/api/documents/nonexistent',
            headers={
                'x-tenant-id': 'test-tenant',
                'x-user-id': 'test-user'
            },
            body=b'',
            params={}
        )
        
        with patch('function_app.get_cosmos_client') as mock_cosmos:
            mock_container = Mock()
            mock_container.read_item.side_effect = Exception("Item not found")
            mock_cosmos.return_value.get_database_client.return_value.get_container_client.return_value = mock_container
            
            response = await get_document(req)
            
            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_list_documents_success(self):
        """Test list documents with successful response"""
        req = HttpRequest(
            method='GET',
            url='http://localhost:7071/api/documents',
            headers={
                'x-tenant-id': 'test-tenant',
                'x-user-id': 'test-user'
            },
            body=b'',
            params={'page': '1', 'pageSize': '10'}
        )
        
        mock_documents = [
            {
                'id': 'doc_1',
                'tenantId': 'test-tenant',
                'status': 'succeeded',
                'createdAt': '2024-08-22T00:00:00Z'
            }
        ]
        
        with patch('function_app.get_cosmos_client') as mock_cosmos:
            mock_container = Mock()
            mock_container.query_items.return_value = mock_documents
            mock_cosmos.return_value.get_database_client.return_value.get_container_client.return_value = mock_container
            
            response = await list_documents(req)
            
            assert response.status_code == 200
            response_data = json.loads(response.get_body())
            assert 'documents' in response_data
            assert len(response_data['documents']) == 1

if __name__ == '__main__':
    pytest.main([__file__])
