# 🚀 Deploy to Cloud Run - Quick Start

Your Cloud Run deployment issue has been **FIXED**! 

## What Was Wrong

Your container wasn't starting because:
1. Server was binding to `localhost` instead of `0.0.0.0` (Cloud Run requirement)
2. Dockerfile had dependency installation issues
3. Missing proper startup logging

## What Was Fixed

✅ Server now binds to `0.0.0.0:8080`  
✅ Dockerfile properly installs all dependencies  
✅ Added startup logging and graceful shutdown  
✅ Created automated deployment scripts  
✅ Created comprehensive documentation  

---

## Deploy in 3 Steps (Windows)

### Step 1: Setup Secrets (One-time)

You need to create secrets in GCP Secret Manager. Run these commands in PowerShell:

```powershell
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create DATABASE_URL secret (replace with your actual database URL)
echo "postgresql://user:password@host:5432/database" | gcloud secrets create DATABASE_URL --data-file=-

# Create JWT_SECRET secret (use a random string)
echo "your-random-jwt-secret-here-change-this" | gcloud secrets create JWT_SECRET --data-file=-

# Grant Cloud Run access to secrets
$PROJECT_ID = gcloud config get-value project
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
$SERVICE_ACCOUNT = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding DATABASE_URL --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding JWT_SECRET --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
```

### Step 2: Deploy

```cmd
deploy-cloud-run.bat
```

That's it! The script will:
1. Build your Docker image
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Show you the live URL

### Step 3: Test

Visit the URL shown at the end of deployment and test your app!

---

## Alternative: Manual Deployment

If you prefer to run commands manually:

```powershell
# Set your project
$PROJECT_ID = gcloud config get-value project

# Build
docker build -t gcr.io/$PROJECT_ID/expectedestate:latest .

# Push
docker push gcr.io/$PROJECT_ID/expectedestate:latest

# Deploy
gcloud run deploy expectedestate `
  --image gcr.io/$PROJECT_ID/expectedestate:latest `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --timeout 300 `
  --max-instances 10 `
  --set-env-vars NODE_ENV=production,PORT=8080 `
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest
```

---

## Verify Deployment

```powershell
# Get your service URL
gcloud run services describe expectedestate --region us-central1 --format "value(status.url)"

# Check health endpoint
$URL = gcloud run services describe expectedestate --region us-central1 --format "value(status.url)"
curl "$URL/api/health"

# View logs
gcloud run services logs tail expectedestate --region us-central1
```

---

## Troubleshooting

### "Secrets not found"
Run Step 1 again to create the secrets.

### "Database connection failed"
Check your DATABASE_URL format:
```
postgresql://user:password@host:5432/database?sslmode=require
```

For Neon database:
```
postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### "Container still not starting"
Check logs:
```powershell
gcloud run services logs read expectedestate --region us-central1 --limit 100
```

---

## Cost

With current settings (512Mi memory, scales to zero):
- **Low traffic:** $0 (free tier)
- **Medium traffic (1M requests/month):** ~$5-10
- **High traffic (10M requests/month):** ~$50-100

Free tier includes:
- 2 million requests/month
- 360,000 GB-seconds/month

---

## Next Steps

After deployment works:

1. ✅ **Test the app** - Visit the URL and verify login/signup works
2. ✅ **Continue Week 1 tasks** - Complete Communication Log backend
3. ✅ **Set up CI/CD** (optional) - Auto-deploy on git push

See `REVISED_EVALUATION_AND_ACTION_PLAN.md` for the full 8-week roadmap.

---

## Documentation

- **`DEPLOYMENT_FIX_SUMMARY.md`** - What was fixed and why
- **`CLOUD_RUN_DEPLOYMENT_GUIDE.md`** - Complete deployment guide
- **`REVISED_EVALUATION_AND_ACTION_PLAN.md`** - 8-week implementation plan

---

## Quick Commands

```powershell
# Deploy
deploy-cloud-run.bat

# View logs
gcloud run services logs tail expectedestate --region us-central1

# Get URL
gcloud run services describe expectedestate --region us-central1 --format "value(status.url)"

# Update environment variable
gcloud run services update expectedestate --region us-central1 --set-env-vars KEY=VALUE

# Scale to zero (save costs)
gcloud run services update expectedestate --region us-central1 --min-instances 0
```

---

**Ready to deploy? Run:** `deploy-cloud-run.bat`

🎉 Your deployment is fixed and ready to go!
