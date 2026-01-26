# 🚀 Deploy to Cloud Run via GCP Console (No CLI Required)

Since you can't install the GCP CLI, you can do everything through the web interface!

## Prerequisites

1. **GCP Account** - Sign up at https://console.cloud.google.com
2. **Docker Desktop** - Install from https://www.docker.com/products/docker-desktop
3. **Git Bash** (for Windows) - Comes with Git for Windows

---

## Step 1: Create GCP Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Name it: `expectedestate` (or whatever you prefer)
5. Click **"Create"**
6. Wait for project creation, then select it

---

## Step 2: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Cloud Run API**
   - **Cloud Build API**
   - **Secret Manager API**
   - **Container Registry API**

Or use these direct links (replace `YOUR_PROJECT_ID`):
- https://console.cloud.google.com/apis/library/run.googleapis.com
- https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com
- https://console.cloud.google.com/apis/library/secretmanager.googleapis.com
- https://console.cloud.google.com/apis/library/containerregistry.googleapis.com

---

## Step 3: Create Secrets

### 3.1 Go to Secret Manager

https://console.cloud.google.com/security/secret-manager

### 3.2 Create DATABASE_URL Secret

1. Click **"Create Secret"**
2. Name: `DATABASE_URL`
3. Secret value: Your PostgreSQL connection string
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```
   
   **For Neon database:**
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

4. Click **"Create Secret"**

### 3.3 Create JWT_SECRET Secret

1. Click **"Create Secret"**
2. Name: `JWT_SECRET`
3. Secret value: A random string (generate one here: https://randomkeygen.com/)
   ```
   your-random-jwt-secret-at-least-32-characters-long
   ```

4. Click **"Create Secret"**

### 3.4 Grant Access to Secrets

For each secret (DATABASE_URL and JWT_SECRET):

1. Click on the secret name
2. Go to **"Permissions"** tab
3. Click **"Grant Access"**
4. In "New principals", enter:
   ```
   YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com
   ```
   
   **To find your project number:**
   - Go to https://console.cloud.google.com/home/dashboard
   - Look for "Project number" on the dashboard
   - Example: `123456789012-compute@developer.gserviceaccount.com`

5. Select role: **"Secret Manager Secret Accessor"**
6. Click **"Save"**

---

## Step 4: Build and Push Docker Image

Since you can't use gcloud CLI, we'll use **Cloud Build** through the console.

### Option A: Using Cloud Build (Recommended)

1. **Connect your GitHub repository:**
   - Go to https://console.cloud.google.com/cloud-build/triggers
   - Click **"Connect Repository"**
   - Select **GitHub**
   - Authenticate and select your repository
   - Click **"Connect"**

2. **Create a manual trigger:**
   - Click **"Create Trigger"**
   - Name: `manual-deploy`
   - Event: **Manual invocation**
   - Source: Your connected repository
   - Branch: `main` (or your branch name)
   - Configuration: **Cloud Build configuration file**
   - Location: `cloudbuild.yaml`
   - Click **"Create"**

3. **Run the trigger:**
   - Click **"Run"** on your trigger
   - Wait for build to complete (10-15 minutes first time)

### Option B: Using Docker + Manual Upload

If you can't connect GitHub, you can build locally and upload:

1. **Build the image locally:**
   ```bash
   # In Git Bash or PowerShell
   docker build -t expectedestate:latest .
   ```

2. **Tag for GCR:**
   ```bash
   docker tag expectedestate:latest gcr.io/YOUR_PROJECT_ID/expectedestate:latest
   ```

3. **Push to GCR manually:**
   - Go to https://console.cloud.google.com/gcr
   - Click **"Upload"** (if available)
   - Or use Docker Desktop to push (requires gcloud auth)

**Note:** Option A (Cloud Build) is much easier!

---

## Step 5: Deploy to Cloud Run

1. **Go to Cloud Run:**
   https://console.cloud.google.com/run

2. **Click "Create Service"**

3. **Configure the service:**

   **Container:**
   - Container image URL: Click **"Select"** and choose your image from Container Registry
   - Or enter manually: `gcr.io/YOUR_PROJECT_ID/expectedestate:latest`

   **Service name:**
   - `expectedestate`

   **Region:**
   - Choose closest to you (e.g., `us-central1`)

   **Authentication:**
   - ✅ Allow unauthenticated invocations

   **Container port:**
   - `8080`

   **Capacity:**
   - Memory: `512 MiB`
   - CPU: `1`
   - Request timeout: `300` seconds
   - Maximum requests per container: `80`

   **Autoscaling:**
   - Minimum instances: `0` (scales to zero)
   - Maximum instances: `10`

   **Environment variables:**
   Click **"Variables & Secrets"** → **"Environment Variables"**
   - Add: `NODE_ENV` = `production`
   - Add: `PORT` = `8080`

   **Secrets:**
   Click **"Variables & Secrets"** → **"Secrets"**
   - Click **"Reference a Secret"**
   - Select `DATABASE_URL`, expose as environment variable, name: `DATABASE_URL`
   - Click **"Reference a Secret"** again
   - Select `JWT_SECRET`, expose as environment variable, name: `JWT_SECRET`

4. **Click "Create"**

5. **Wait for deployment** (2-3 minutes)

6. **Get your URL:**
   - After deployment, you'll see a URL like: `https://expectedestate-xxx-uc.a.run.app`
   - Click it to test your app!

---

## Step 6: Verify Deployment

### Test Health Endpoint

Visit: `https://your-service-url.run.app/api/health`

Should return:
```json
{"status":"ok"}
```

### Test the App

1. Visit your service URL
2. Try to sign up for a new account
3. Log in
4. Create an estate
5. Add an asset

### View Logs

1. Go to your Cloud Run service
2. Click **"Logs"** tab
3. Look for:
   ```
   ✅ Server running on http://0.0.0.0:8080
   ✅ Environment: production
   ✅ Database: Connected
   ```

---

## Troubleshooting

### Issue: "Service not found" or "Image not found"

**Solution:**
1. Go to https://console.cloud.google.com/gcr
2. Verify your image exists
3. Copy the full image URL
4. Use it when creating the Cloud Run service

---

### Issue: "Database connection failed"

**Solution:**
1. Go to Secret Manager
2. Click on `DATABASE_URL`
3. Click **"View secret value"**
4. Verify the format:
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```
5. Make sure `?sslmode=require` is at the end

---

### Issue: "Secrets not accessible"

**Solution:**
1. Go to each secret (DATABASE_URL, JWT_SECRET)
2. Click **"Permissions"** tab
3. Verify the compute service account has access:
   ```
   YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com
   ```
4. Role should be: **"Secret Manager Secret Accessor"**

---

### Issue: "Container failed to start"

**Solution:**
1. Check logs in Cloud Run service → **"Logs"** tab
2. Look for error messages
3. Common issues:
   - Database URL incorrect
   - Secrets not accessible
   - Port not set to 8080

---

## Update Deployment

To deploy a new version:

### If using Cloud Build trigger:
1. Push your code to GitHub
2. Go to Cloud Build triggers
3. Click **"Run"** on your trigger
4. Wait for build to complete
5. Cloud Run will automatically use the new image

### If deploying manually:
1. Go to your Cloud Run service
2. Click **"Edit & Deploy New Revision"**
3. Select the new image (if you built a new one)
4. Click **"Deploy"**

---

## Cost Monitoring

1. **Go to Billing:**
   https://console.cloud.google.com/billing

2. **Set up budget alerts:**
   - Click **"Budgets & alerts"**
   - Click **"Create Budget"**
   - Set amount: $10/month (or whatever you want)
   - Set alert at 50%, 90%, 100%

3. **View current costs:**
   - Go to **"Reports"**
   - Filter by service: Cloud Run

---

## Alternative: Deploy via GitHub Actions (No CLI Required)

If you want automatic deployments on git push:

1. **Create GitHub Actions workflow:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
    
    - name: Configure Docker
      run: gcloud auth configure-docker
    
    - name: Build and Push
      run: |
        docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/expectedestate:${{ github.sha }} .
        docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/expectedestate:${{ github.sha }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy expectedestate \
          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/expectedestate:${{ github.sha }} \
          --region us-central1 \
          --platform managed \
          --allow-unauthenticated
```

2. **Create service account:**
   - Go to https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create service account with Cloud Run Admin and Storage Admin roles
   - Create JSON key
   - Add to GitHub secrets as `GCP_SA_KEY`

3. **Add GitHub secrets:**
   - Go to your GitHub repo → Settings → Secrets
   - Add `GCP_PROJECT_ID`
   - Add `GCP_SA_KEY` (the JSON key content)

4. **Push to deploy:**
   ```bash
   git push origin main
   ```

---

## Summary

**Without CLI, you can:**
1. ✅ Create secrets via web console
2. ✅ Build via Cloud Build (connected to GitHub)
3. ✅ Deploy via Cloud Run console
4. ✅ Monitor via web console
5. ✅ Update via web console

**Recommended approach:**
1. Connect GitHub to Cloud Build
2. Create manual trigger
3. Run trigger to build
4. Deploy via Cloud Run console

**This way you never need the CLI!** 🎉

---

## Quick Links

- **Cloud Run:** https://console.cloud.google.com/run
- **Cloud Build:** https://console.cloud.google.com/cloud-build
- **Secret Manager:** https://console.cloud.google.com/security/secret-manager
- **Container Registry:** https://console.cloud.google.com/gcr
- **Logs:** https://console.cloud.google.com/logs
- **Billing:** https://console.cloud.google.com/billing

---

**Need help?** Check the logs in Cloud Run → Logs tab for error messages.
