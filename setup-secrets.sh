#!/bin/bash

# ExpectedEstate - GCP Secrets Setup Script
# This script creates the required secrets in GCP Secret Manager

set -e  # Exit on error

echo "🔐 ExpectedEstate - GCP Secrets Setup"
echo "======================================"
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

# Enable Secret Manager API
echo "🔧 Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com
echo "✅ Secret Manager API enabled"
echo ""

# Get Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "🔑 Service Account: $SERVICE_ACCOUNT"
echo ""

# Function to create or update a secret
create_secret() {
    local SECRET_NAME=$1
    local SECRET_DESCRIPTION=$2
    
    echo "📝 Setting up: $SECRET_NAME"
    echo "   Description: $SECRET_DESCRIPTION"
    
    # Prompt for secret value
    read -sp "   Enter value (hidden): " SECRET_VALUE
    echo ""
    
    if [ -z "$SECRET_VALUE" ]; then
        echo "   ⚠️  Skipped (empty value)"
        echo ""
        return
    fi
    
    # Check if secret exists
    if gcloud secrets describe $SECRET_NAME &>/dev/null; then
        echo "   ℹ️  Secret exists, adding new version..."
        echo -n "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=-
    else
        echo "   ℹ️  Creating new secret..."
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME --data-file=-
    fi
    
    # Grant access to Cloud Run service account
    echo "   🔓 Granting access to Cloud Run..."
    gcloud secrets add-iam-policy-binding $SECRET_NAME \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet
    
    echo "   ✅ $SECRET_NAME configured"
    echo ""
}

# Create required secrets
echo "Setting up required secrets..."
echo ""

create_secret "DATABASE_URL" "PostgreSQL connection string (e.g., postgresql://user:pass@host:5432/db)"
create_secret "JWT_SECRET" "Random secret for JWT token signing (e.g., generate with: openssl rand -base64 32)"

# Optional secrets
echo "Setting up optional secrets (press Enter to skip)..."
echo ""

create_secret "GROQ_API_KEY" "Groq API key for AI features (optional)"
create_secret "MAILGUN_API_KEY" "Mailgun API key for email features (optional)"
create_secret "MAILGUN_DOMAIN" "Mailgun domain for email features (optional)"

echo ""
echo "✅ Secrets setup complete!"
echo ""
echo "📋 List all secrets:"
echo "   gcloud secrets list"
echo ""
echo "🔍 View a secret value:"
echo "   gcloud secrets versions access latest --secret=DATABASE_URL"
echo ""
echo "🚀 Next step: Deploy your app"
echo "   ./deploy-cloud-run.sh"
echo ""
