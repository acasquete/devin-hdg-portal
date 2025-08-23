#!/bin/bash


set -e

FUNCTION_APP_NAME="hdg-dev-functions"
BASE_URL="https://$FUNCTION_APP_NAME.azurewebsites.net/api"

echo "Testing Azure Functions endpoints..."
echo "Base URL: $BASE_URL"

echo ""
echo "Testing health endpoint..."
curl -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

if [ -f "test-document.pdf" ]; then
  echo ""
  echo "Testing document upload..."
  UPLOAD_RESPONSE=$(curl -X POST "$BASE_URL/documents" \
    -F "file=@test-document.pdf" \
    -w "\nStatus: %{http_code}\n")
  
  echo "$UPLOAD_RESPONSE"
  
  DOCUMENT_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"documentId":"[^"]*"' | cut -d'"' -f4)
  
  if [ ! -z "$DOCUMENT_ID" ]; then
    echo ""
    echo "Testing document status check..."
    sleep 2
    curl -X GET "$BASE_URL/documents/$DOCUMENT_ID" \
      -H "Content-Type: application/json" \
      -w "\nStatus: %{http_code}\n"
  fi
else
  echo ""
  echo "No test-document.pdf found. Skipping upload test."
  echo "To test upload, create a test PDF file named 'test-document.pdf'"
fi

echo ""
echo "✅ API testing completed!"
