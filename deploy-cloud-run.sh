#!/bin/bash

# ExpectedEstate - Cloud Run Deployment Script
# This script deploys your app to GCP Cloud Run

set -e  # Exit on error

echo "🚀 ExpectedEstate Cloud Run Deployment"
echo "========================================"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No GCP project set"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo ""

# Configuration
SERVICE_NAME="expectedestate"
REGION="us-central1"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

echo "🔧 Configuration:"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "  Image: $IMAGE"
echo ""

# Ask for confirmation
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Step 1: Build the Docker image
echo ""
echo "📦 Step 1/3: Building Docker image..."
docker build -t $IMAGE .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"

# Step 2: Push to Google Container Registry
echo ""
echo "📤 Step 2/3: Pushing image to GCR..."
docker push $IMAGE

if [ $? -ne 0 ]; then
    echo "❌ Docker push failed"
    exit 1
fi

echo "✅ Image pushed successfully"

# Step 3: Deploy to Cloud Run
echo ""
echo "🚀 Step 3/3: Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed"
    echo ""
    echo "Common issues:"
    echo "  1. Secrets not created (DATABASE_URL, JWT_SECRET)"
    echo "  2. Cloud Run API not enabled"
    echo "  3. Insufficient permissions"
    echo ""
    echo "See CLOUD_RUN_DEPLOYMENT_GUIDE.md for troubleshooting"
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo "🎉 Your app is live at:"
echo "   $SERVICE_URL"
echo ""
echo "📊 View logs:"
echo "   gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
echo "🔍 Check status:"
echo "   gcloud run services describe $SERVICE_NAME --region $REGION"
echo ""
