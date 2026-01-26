# 📋 Step-by-Step Deployment Guide (No CLI Required)

## Overview

This guide walks you through deploying to GCP Cloud Run using **only the web browser**. No command line tools needed!

**Time required:** 30-45 minutes (first time)

---

## ✅ Checklist

Before you start, make sure you have:
- [ ] GCP account (sign up at https://console.cloud.google.com)
- [ ] Credit card added to GCP (required, but you get $300 free credit)
- [ ] Your database URL (from Neon or other PostgreSQL provider)
- [ ] Docker Desktop installed (optional, only if building locally)

---

## Part 1: GCP Project Setup (5 minutes)

### Step 1.1: Create Project

1. Go to: https://console.cloud.google.com
2. Click the project dropdown (top left, next to "Google Cloud")
3. Click **"NEW PROJECT"**
4. Enter project name: `expectedestate`
5. Click **"CREATE"**
6. Wait 30 seconds for project creation
7. Click **"SELECT PROJECT"** when it appears

**✅ Checkpoint:** You should see "expectedestate" in the project dropdown

---

### Step 1.2: Enable APIs

Click these links (they'll open in new tabs):

1. **Cloud Run API:**
   https://console.cloud.google.com/apis/library/run.googleapis.com
   - Click **"ENABLE"**

2. **Cloud Build API:**
   https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com
   - Click **"ENABLE"**

3. **Secret Manager API:**
   https://console.cloud.google.com/apis/library/secretmanager.googleapis.com
   - Click **"ENABLE"**

4. **Container Registry API:**
   https://console.cloud.google.com/apis/library/containerregistry.googleapis.com
   - Click **"ENABLE"**

**✅ Checkpoint:** All 4 APIs should show "API enabled"

---

## Part 2: Create Secrets (10 minutes)

### Step 2.1: Go to Secret Manager

https://console.cloud.google.com/security/secret-manager

### Step 2.2: Create DATABASE_URL

1. Click **"+ CREATE SECRET"** (top of page)

2. Fill in:
   - **Name:** `DATABASE_URL`
   - **Secret value:** Your PostgreSQL connection string
   
   **Example for Neon:**
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   
   **Example for other PostgreSQL:**
   ```
   postgresql://username:password@your-host.com:5432/database?sslmode=require
   ```

3. Click **"CREATE SECRET"**

**✅ Checkpoint:** You should see "DATABASE_URL" in the secrets list

---

### Step 2.3: Create JWT_SECRET

1. Click **"+ CREATE SECRET"**

2. Fill in:
   - **Name:** `JWT_SECRET`
   - **Secret value:** A random string (at least 32 characters)
   
   **Generate a random secret:**
   - Go to: https://randomkeygen.com/
   - Copy one of the "Fort Knox Passwords"
   - Or use: `your-super-secret-jwt-key-change-this-to-something-random-123456`

3. Click **"CREATE SECRET"**

**✅ Checkpoint:** You should see both "DATABASE_URL" and "JWT_SECRET" in the secrets list

---

### Step 2.4: Grant Access to Secrets

**First, find your project number:**
1. Go to: https://console.cloud.google.com/home/dashboard
2. Look for **"Project number"** (it's a long number like `123456789012`)
3. Copy it

**Then, for EACH secret (DATABASE_URL and JWT_SECRET):**

1. Click on the secret name
2. Click **"PERMISSIONS"** tab
3. Click **"+ GRANT ACCESS"**
4. In "New principals" field, enter:
   ```
   YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com
   ```
   Replace `YOUR_PROJECT_NUMBER` with the number you copied
   
   Example: `123456789012-compute@developer.gserviceaccount.com`

5. In "Select a role" dropdown:
   - Search for: `Secret Manager Secret Accessor`
   - Select it

6. Click **"SAVE"**

**✅ Checkpoint:** Both secrets should show the compute service account in their permissions

---

## Part 3: Build Docker Image (15 minutes)

You have 2 options:

### Option A: Using Cloud Build (Recommended - No Docker needed!)

#### Step 3A.1: Connect GitHub

1. Go to: https://console.cloud.google.com/cloud-build/triggers
2. Click **"CONNECT REPOSITORY"**
3. Select source: **"GitHub"**
4. Click **"Continue"**
5. Click **"Authenticate"** and sign in to GitHub
6. Select your repository
7. Check the box: "I understand..."
8. Click **"CONNECT"**

#### Step 3A.2: Create Build Trigger

1. Click **"CREATE TRIGGER"**
2. Fill in:
   - **Name:** `manual-deploy`
   - **Event:** Select **"Manual invocation"**
   - **Source:** Your repository should be selected
   - **Branch:** `^main$` (or your branch name)
   - **Configuration:** Select **"Cloud Build configuration file (yaml or json)"**
   - **Location:** `cloudbuild.yaml`
3. Click **"CREATE"**

#### Step 3A.3: Run the Build

1. Find your trigger in the list
2. Click **"RUN"** button
3. Click **"RUN TRIGGER"** in the popup
4. Wait 10-15 minutes for first build (subsequent builds are faster)
5. Watch the logs - you should see:
   - Building Docker image
   - Pushing to Container Registry
   - Deploying to Cloud Run

**✅ Checkpoint:** Build should complete with "SUCCESS" status

---

### Option B: Build Locally (If you have Docker Desktop)

1. Open PowerShell or Git Bash in your project folder

2. Build the image:
   ```bash
   docker build -t expectedestate:latest .
   ```

3. This will take 10-15 minutes first time

4. **Problem:** You can't push to GCR without gcloud CLI

**Recommendation:** Use Option A (Cloud Build) instead!

---

## Part 4: Deploy to Cloud Run (10 minutes)

### Step 4.1: Go to Cloud Run

https://console.cloud.google.com/run

### Step 4.2: Create Service

1. Click **"+ CREATE SERVICE"**

2. **Container image URL:**
   - Click **"SELECT"**
   - Navigate to: Container Registry → gcr.io → [your-project] → expectedestate
   - Select the image with tag `latest` or the commit SHA
   - Click **"SELECT"**

3. **Service name:**
   - Enter: `expectedestate`

4. **Region:**
   - Select: `us-central1` (or closest to you)

5. **CPU allocation and pricing:**
   - Select: **"CPU is only allocated during request processing"**

6. **Authentication:**
   - Select: **"Allow unauthenticated invocations"**

7. Click **"CONTAINER, NETWORKING, SECURITY"** to expand

### Step 4.3: Configure Container

**Container tab:**

1. **Container port:** `8080`

2. **Memory:** `512 MiB`

3. **CPU:** `1`

4. **Request timeout:** `300` seconds

5. **Maximum requests per container:** `80`

### Step 4.4: Add Environment Variables

1. Click **"VARIABLES & SECRETS"** tab

2. Click **"+ ADD VARIABLE"**
   - Name: `NODE_ENV`
   - Value: `production`

3. Click **"+ ADD VARIABLE"** again
   - Name: `PORT`
   - Value: `8080`

### Step 4.5: Add Secrets

1. Still in **"VARIABLES & SECRETS"** tab

2. Click **"REFERENCE A SECRET"**
   - Select: `DATABASE_URL`
   - Reference method: **"Exposed as environment variable"**
   - Name: `DATABASE_URL`
   - Click **"DONE"**

3. Click **"REFERENCE A SECRET"** again
   - Select: `JWT_SECRET`
   - Reference method: **"Exposed as environment variable"**
   - Name: `JWT_SECRET`
   - Click **"DONE"**

### Step 4.6: Configure Autoscaling

1. Click **"AUTOSCALING"** section

2. **Minimum number of instances:** `0` (scales to zero when not in use)

3. **Maximum number of instances:** `10`

### Step 4.7: Deploy!

1. Click **"CREATE"** at the bottom

2. Wait 2-3 minutes for deployment

3. You'll see a green checkmark when done

4. **Copy your service URL** - it looks like:
   ```
   https://expectedestate-xxx-uc.a.run.app
   ```

**✅ Checkpoint:** Service should show "Serving" status with a green checkmark

---

## Part 5: Test Your Deployment (5 minutes)

### Step 5.1: Test Health Endpoint

1. Open a new browser tab

2. Go to: `https://your-service-url.run.app/api/health`
   (Replace with your actual URL)

3. You should see:
   ```json
   {"status":"ok"}
   ```

**✅ Checkpoint:** Health endpoint returns OK

---

### Step 5.2: Test the App

1. Go to your service URL: `https://your-service-url.run.app`

2. You should see your app's landing page

3. Try to:
   - Click "Sign Up"
   - Create an account
   - Log in
   - Create an estate
   - Add an asset

**✅ Checkpoint:** You can sign up and log in successfully

---

### Step 5.3: Check Logs

1. Go back to Cloud Run console

2. Click on your service name

3. Click **"LOGS"** tab

4. You should see:
   ```
   ✅ Server running on http://0.0.0.0:8080
   ✅ Environment: production
   ✅ Database: Connected
   ```

**✅ Checkpoint:** Logs show successful startup

---

## 🎉 Success!

Your app is now live on Cloud Run!

**Your app URL:** `https://expectedestate-xxx-uc.a.run.app`

---

## Common Issues & Solutions

### Issue 1: "Container failed to start"

**Check:**
1. Go to Logs tab
2. Look for error messages
3. Common causes:
   - DATABASE_URL format incorrect
   - Secrets not accessible
   - Port not set to 8080

**Fix:**
1. Verify DATABASE_URL format includes `?sslmode=require`
2. Check secret permissions (Step 2.4)
3. Verify PORT environment variable is set to `8080`

---

### Issue 2: "Database connection failed"

**Check:**
1. Go to Secret Manager
2. Click DATABASE_URL
3. Click "View secret value"
4. Verify format:
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```

**Fix:**
1. Update the secret with correct URL
2. Redeploy the service (Edit & Deploy New Revision)

---

### Issue 3: "Image not found"

**Check:**
1. Go to Container Registry: https://console.cloud.google.com/gcr
2. Verify your image exists

**Fix:**
1. Re-run the Cloud Build trigger
2. Wait for build to complete
3. Try deploying again

---

### Issue 4: "Secrets not accessible"

**Check:**
1. Go to each secret
2. Click Permissions tab
3. Verify compute service account has access

**Fix:**
1. Add the service account (Step 2.4)
2. Redeploy the service

---

## Update Your App

To deploy a new version:

1. Push your code to GitHub

2. Go to Cloud Build triggers

3. Click **"RUN"** on your trigger

4. Wait for build to complete

5. Cloud Run will automatically use the new image

---

## Monitor Costs

1. Go to: https://console.cloud.google.com/billing

2. Click **"Budgets & alerts"**

3. Click **"CREATE BUDGET"**

4. Set amount: $10/month

5. Set alerts at 50%, 90%, 100%

**Expected costs:**
- Low traffic: $0 (free tier)
- Medium traffic: $5-10/month
- High traffic: $50-100/month

---

## Next Steps

1. ✅ **Test thoroughly** - Try all features
2. ✅ **Set up custom domain** (optional)
3. ✅ **Continue with Week 1 tasks** - Complete Communication Log backend
4. ✅ **Set up monitoring** - Enable Cloud Monitoring

See `REVISED_EVALUATION_AND_ACTION_PLAN.md` for the full 8-week roadmap.

---

## Quick Reference

**Your URLs:**
- App: `https://expectedestate-xxx-uc.a.run.app`
- Health: `https://expectedestate-xxx-uc.a.run.app/api/health`
- Cloud Run: https://console.cloud.google.com/run
- Logs: https://console.cloud.google.com/logs
- Secrets: https://console.cloud.google.com/security/secret-manager

**Need help?** Check the logs first - they usually show what's wrong!

---

**Congratulations! Your app is deployed! 🚀**
