#!/bin/bash


set -e

RESOURCE_GROUP_NAME="rg-document-management"

echo "🗑️ Starting Azure resource cleanup..."

if az group exists --name $RESOURCE_GROUP_NAME; then
  echo "📦 Deleting Resource Group: $RESOURCE_GROUP_NAME"
  echo "⚠️ This will delete ALL resources in the group!"
  read -p "Are you sure? (y/N): " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    az group delete \
      --name $RESOURCE_GROUP_NAME \
      --yes \
      --no-wait
    
    echo "✅ Resource group deletion initiated"
    echo "🕐 Deletion is running in the background and may take several minutes"
  else
    echo "❌ Cleanup cancelled"
    exit 1
  fi
else
  echo "ℹ️ Resource group $RESOURCE_GROUP_NAME does not exist"
fi

if [ -f ".env.production" ]; then
  echo "🧹 Removing local .env.production file"
  rm .env.production
fi

echo "✅ Cleanup completed!"
