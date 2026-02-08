# GCP Cloud Run Deployment Guide

## Problem You Were Facing

**Error:** "The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable"

**Root Causes:**
1. Server wasn't binding to `0.0.0.0` (required for Cloud Run)
2. Dockerfile wasn't properly installing dependencies
3. Missing proper startup logging
4. No graceful shutdown handling

## Fixes Applied

### 1. Updated `server/index.ts`
- ✅ Changed `app.listen(port)` to `app.listen(port, '0.0.0.0')`
- ✅ Added startup logging (environment, database status)
- ✅ Added graceful shutdown handler for SIGTERM
- ✅ Better error visibility

### 2. Updated `Dockerfile`
- ✅ Proper multi-stage build
- ✅ Install all dependencies in builder stage
- ✅ Install only production deps + tsx in runner stage
- ✅ Properly copy Prisma generated files
- ✅ Set PORT=8080 explicitly

### 3. Created `.dockerignore`
- ✅ Speeds up builds by excluding unnecessary files

### 4. Created `cloudbuild.yaml`
- ✅ Proper Cloud Build configuration
- ✅ Automatic deployment to Cloud Run
- ✅ Environment variables and secrets configuration

---

## Deployment Steps

### Prerequisites

1. **GCP Project Setup**
   ```bash
   # Set your project ID
   export PROJECT_ID="your-project-id"
   gcloud config set project $PROJECT_ID
   ```

2. **Enable Required APIs**
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

3. **Create Secrets in Secret Manager**
   ```bash
   # Create DATABASE_URL secret
   echo -n "postgresql://user:password@host:5432/database" | \
     gcloud secrets create DATABASE_URL --data-file=-

   # Create JWT_SECRET secret
   echo -n "your-random-jwt-secret-here" | \
     gcloud secrets create JWT_SECRET --data-file=-

   # Optional: GROQ_API_KEY
   echo -n "your-groq-api-key" | \
     gcloud secrets create GROQ_API_KEY --data-file=-
   ```

4. **Grant Cloud Run Access to Secrets**
   ```bash
   # Get the Cloud Run service account
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
   SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

   # Grant access to secrets
   gcloud secrets add-iam-policy-binding DATABASE_URL \
     --member="serviceAccount:${SERVICE_ACCOUNT}" \
     --role="roles/secretmanager.secretAccessor"

   gcloud secrets add-iam-policy-binding JWT_SECRET \
     --member="serviceAccount:${SERVICE_ACCOUNT}" \
     --role="roles/secretmanager.secretAccessor"
   ```

---

### Option 1: Deploy Using Cloud Build (Recommended)

This uses the `cloudbuild.yaml` file for automated deployment.

```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Monitor deployment
gcloud run services describe expectedestate --region us-central1
```

**Note:** Update `cloudbuild.yaml` if you need to:
- Change service name (currently `expectedestate`)
- Change region (currently `us-central1`)
- Adjust memory/CPU limits
- Add more environment variables or secrets

---

### Option 2: Manual Docker Build + Deploy

If you prefer manual control:

```bash
# 1. Build the Docker image
docker build -t gcr.io/$PROJECT_ID/expectedestate:latest .

# 2. Push to Google Container Registry
docker push gcr.io/$PROJECT_ID/expectedestate:latest

# 3. Deploy to Cloud Run
gcloud run deploy expectedestate \
  --image gcr.io/$PROJECT_ID/expectedestate:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest
```

---

### Option 3: Local Testing Before Deployment

Test the Docker container locally before deploying:

```bash
# 1. Build the image
docker build -t expectedestate-local .

# 2. Run locally with environment variables
docker run -p 8080:8080 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -e NODE_ENV=production \
  -e PORT=8080 \
  expectedestate-local

# 3. Test the health endpoint
curl http://localhost:8080/api/health

# 4. Test the app
open http://localhost:8080
```

---

## Troubleshooting

### 1. Container Still Not Starting

**Check logs:**
```bash
gcloud run services logs read expectedestate --region us-central1 --limit 50
```

**Common issues:**
- Database connection failing (check DATABASE_URL secret)
- Prisma client not generated (check Dockerfile COPY steps)
- Port binding issue (ensure server binds to 0.0.0.0)

### 2. Database Connection Issues

**Verify DATABASE_URL format:**
```
postgresql://username:password@host:5432/database?sslmode=require
```

**For Neon (recommended):**
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Test connection:**
```bash
# Get the secret value
gcloud secrets versions access latest --secret="DATABASE_URL"

# Test with psql
psql "$(gcloud secrets versions access latest --secret='DATABASE_URL')"
```

### 3. Build Timeout

If builds are timing out:

```bash
# Increase timeout in cloudbuild.yaml
timeout: 3600s  # 1 hour

# Or use a more powerful machine
options:
  machineType: 'N1_HIGHCPU_32'
```

### 4. Memory Issues

If the app crashes due to memory:

```bash
# Increase memory allocation
gcloud run services update expectedestate \
  --region us-central1 \
  --memory 1Gi
```

### 5. Cold Start Issues

If the app is slow to start:

```bash
# Set minimum instances to keep warm
gcloud run services update expectedestate \
  --region us-central1 \
  --min-instances 1
```

---

## Monitoring

### View Logs
```bash
# Real-time logs
gcloud run services logs tail expectedestate --region us-central1

# Recent logs
gcloud run services logs read expectedestate --region us-central1 --limit 100
```

### Check Service Status
```bash
gcloud run services describe expectedestate --region us-central1
```

### Get Service URL
```bash
gcloud run services describe expectedestate \
  --region us-central1 \
  --format 'value(status.url)'
```

---

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string (from Secret Manager)
- `JWT_SECRET` - Secret for JWT token signing (from Secret Manager)
- `PORT` - Port to listen on (automatically set to 8080 by Cloud Run)
- `NODE_ENV` - Set to `production`

### Optional
- `GROQ_API_KEY` - For AI features
- `MAILGUN_API_KEY` - For email features
- `MAILGUN_DOMAIN` - For email features

---

## Cost Optimization

### Current Configuration
- Memory: 512Mi
- CPU: 1 vCPU (default)
- Max instances: 10
- Min instances: 0 (scales to zero)

### Estimated Costs (Low Traffic)
- **Free tier:** 2 million requests/month, 360,000 GB-seconds/month
- **After free tier:** ~$0.40 per million requests
- **With min-instances=0:** Scales to zero when not in use = $0 when idle

### Reduce Costs Further
```bash
# Scale to zero when idle (default)
gcloud run services update expectedestate \
  --region us-central1 \
  --min-instances 0

# Reduce memory if possible
gcloud run services update expectedestate \
  --region us-central1 \
  --memory 256Mi

# Set max instances lower
gcloud run services update expectedestate \
  --region us-central1 \
  --max-instances 5
```

---

## CI/CD Setup (Optional)

### Connect to GitHub

1. **Go to Cloud Build Triggers:**
   ```bash
   open "https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
   ```

2. **Create Trigger:**
   - Source: GitHub repository
   - Event: Push to branch `main`
   - Configuration: Cloud Build configuration file
   - Location: `cloudbuild.yaml`

3. **Push to deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Cloud Run"
   git push origin main
   ```

---

## Next Steps

1. ✅ **Deploy the app** using one of the methods above
2. ✅ **Test the deployment** by visiting the Cloud Run URL
3. ✅ **Set up custom domain** (optional)
4. ✅ **Configure CI/CD** for automatic deployments
5. ✅ **Monitor logs** and performance
6. ✅ **Continue with Week 1 tasks** from the action plan

---

## Custom Domain Setup (Optional)

```bash
# 1. Verify domain ownership in Google Search Console
# 2. Map domain to Cloud Run
gcloud run domain-mappings create \
  --service expectedestate \
  --domain yourdomain.com \
  --region us-central1

# 3. Add DNS records (shown in output)
```

---

## Support

If you encounter issues:

1. Check logs: `gcloud run services logs read expectedestate --region us-central1`
2. Verify secrets: `gcloud secrets list`
3. Test locally: `docker run -p 8080:8080 ...`
4. Check Cloud Run docs: https://cloud.google.com/run/docs

---

**Your app should now be deployed and running on Cloud Run!** 🚀

Get your service URL:
```bash
gcloud run services describe expectedestate --region us-central1 --format 'value(status.url)'
```
