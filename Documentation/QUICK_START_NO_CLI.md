# ⚡ Quick Start - Deploy Without CLI

## 🎯 Goal
Deploy your app to GCP Cloud Run using **only your web browser**. No command line tools needed!

---

## 📋 What You Need

- [ ] GCP account (https://console.cloud.google.com)
- [ ] Your database URL (from Neon or other PostgreSQL)
- [ ] 30-45 minutes

---

## 🚀 5-Step Deployment

### Step 1: Create GCP Project (2 min)
1. Go to https://console.cloud.google.com
2. Create new project: `expectedestate`
3. Enable these APIs (click links):
   - [Cloud Run](https://console.cloud.google.com/apis/library/run.googleapis.com)
   - [Cloud Build](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com)
   - [Secret Manager](https://console.cloud.google.com/apis/library/secretmanager.googleapis.com)
   - [Container Registry](https://console.cloud.google.com/apis/library/containerregistry.googleapis.com)

---

### Step 2: Create Secrets (5 min)
1. Go to [Secret Manager](https://console.cloud.google.com/security/secret-manager)

2. Create `DATABASE_URL`:
   - Click "+ CREATE SECRET"
   - Name: `DATABASE_URL`
   - Value: `postgresql://user:pass@host:5432/db?sslmode=require`
   - Click "CREATE SECRET"

3. Create `JWT_SECRET`:
   - Click "+ CREATE SECRET"
   - Name: `JWT_SECRET`
   - Value: Random string (get from https://randomkeygen.com/)
   - Click "CREATE SECRET"

4. Grant access to BOTH secrets:
   - Click secret → "PERMISSIONS" tab → "+ GRANT ACCESS"
   - Principal: `YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com`
   - Role: "Secret Manager Secret Accessor"
   - Click "SAVE"
   
   **Find project number:** https://console.cloud.google.com/home/dashboard

---

### Step 3: Build Image (15 min)
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)

2. Connect GitHub:
   - Click "CONNECT REPOSITORY"
   - Select "GitHub" → Authenticate
   - Select your repository
   - Click "CONNECT"

3. Create trigger:
   - Click "CREATE TRIGGER"
   - Name: `manual-deploy`
   - Event: "Manual invocation"
   - Configuration: "Cloud Build configuration file"
   - Location: `cloudbuild.yaml`
   - Click "CREATE"

4. Run build:
   - Click "RUN" on your trigger
   - Wait 10-15 minutes

---

### Step 4: Deploy to Cloud Run (5 min)
1. Go to [Cloud Run](https://console.cloud.google.com/run)

2. Click "+ CREATE SERVICE"

3. Configure:
   - **Image:** Click "SELECT" → Choose your image from Container Registry
   - **Service name:** `expectedestate`
   - **Region:** `us-central1`
   - **Authentication:** "Allow unauthenticated invocations"
   - **Container port:** `8080`
   - **Memory:** `512 MiB`
   - **CPU:** `1`

4. Add environment variables:
   - Click "VARIABLES & SECRETS" tab
   - Add variable: `NODE_ENV` = `production`
   - Add variable: `PORT` = `8080`

5. Add secrets:
   - Click "REFERENCE A SECRET"
   - Select `DATABASE_URL` → Expose as env var → Name: `DATABASE_URL`
   - Click "REFERENCE A SECRET"
   - Select `JWT_SECRET` → Expose as env var → Name: `JWT_SECRET`

6. Set autoscaling:
   - Min instances: `0`
   - Max instances: `10`

7. Click "CREATE"

8. Wait 2-3 minutes

---

### Step 5: Test (2 min)
1. Copy your service URL (looks like `https://expectedestate-xxx.run.app`)

2. Test health: `https://your-url.run.app/api/health`
   - Should return: `{"status":"ok"}`

3. Test app: `https://your-url.run.app`
   - Try signing up and logging in

---

## ✅ Done!

Your app is live! 🎉

**Service URL:** `https://expectedestate-xxx.run.app`

---

## 🔧 Troubleshooting

### Container won't start?
1. Check [Logs](https://console.cloud.google.com/logs)
2. Look for error messages
3. Common fixes:
   - Verify DATABASE_URL format includes `?sslmode=require`
   - Check secret permissions
   - Verify PORT is set to `8080`

### Database connection failed?
1. Go to [Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Click DATABASE_URL → "View secret value"
3. Verify format:
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```

### Image not found?
1. Go to [Container Registry](https://console.cloud.google.com/gcr)
2. Verify image exists
3. Re-run Cloud Build trigger if needed

---

## 📚 Detailed Guides

- **Step-by-step with screenshots:** `DEPLOY_STEP_BY_STEP.md`
- **Complete console guide:** `DEPLOY_VIA_GCP_CONSOLE.md`
- **Troubleshooting:** `CLOUD_RUN_DEPLOYMENT_GUIDE.md`

---

## 💰 Cost

**Current setup:**
- Memory: 512Mi
- Scales to zero when idle
- Free tier: 2M requests/month

**Expected costs:**
- Low traffic: **$0** (free tier)
- Medium traffic: **$5-10/month**
- High traffic: **$50-100/month**

---

## 🔄 Update Your App

1. Push code to GitHub
2. Go to [Cloud Build](https://console.cloud.google.com/cloud-build/triggers)
3. Click "RUN" on your trigger
4. Wait for build
5. Cloud Run auto-updates

---

## 📊 Monitor

- **Logs:** https://console.cloud.google.com/logs
- **Metrics:** https://console.cloud.google.com/run
- **Billing:** https://console.cloud.google.com/billing

---

## 🆘 Need Help?

1. Check logs first (usually shows the problem)
2. Read `DEPLOY_STEP_BY_STEP.md` for detailed instructions
3. Verify all secrets are created and accessible
4. Make sure all 4 APIs are enabled

---

**Quick Links:**
- [Cloud Run](https://console.cloud.google.com/run)
- [Cloud Build](https://console.cloud.google.com/cloud-build)
- [Secret Manager](https://console.cloud.google.com/security/secret-manager)
- [Logs](https://console.cloud.google.com/logs)

---

**Ready to deploy? Start with Step 1!** 🚀
