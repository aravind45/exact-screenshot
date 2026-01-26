@echo off
REM ExpectedEstate - Cloud Run Deployment Script (Windows)
REM This script deploys your app to GCP Cloud Run

echo.
echo 🚀 ExpectedEstate Cloud Run Deployment
echo ========================================
echo.

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud CLI is not installed
    echo Install it from: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

REM Get project ID
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set PROJECT_ID=%%i
if "%PROJECT_ID%"=="" (
    echo ❌ Error: No GCP project set
    echo Run: gcloud config set project YOUR_PROJECT_ID
    exit /b 1
)

echo 📦 Project: %PROJECT_ID%
echo.

REM Configuration
set SERVICE_NAME=expectedestate
set REGION=us-central1
set IMAGE=gcr.io/%PROJECT_ID%/%SERVICE_NAME%:latest

echo 🔧 Configuration:
echo   Service: %SERVICE_NAME%
echo   Region: %REGION%
echo   Image: %IMAGE%
echo.

REM Ask for confirmation
set /p CONFIRM="Continue with deployment? (y/n) "
if /i not "%CONFIRM%"=="y" (
    echo ❌ Deployment cancelled
    exit /b 1
)

REM Step 1: Build the Docker image
echo.
echo 📦 Step 1/3: Building Docker image...
docker build -t %IMAGE% .

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker build failed
    exit /b 1
)

echo ✅ Docker image built successfully

REM Step 2: Push to Google Container Registry
echo.
echo 📤 Step 2/3: Pushing image to GCR...
docker push %IMAGE%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker push failed
    exit /b 1
)

echo ✅ Image pushed successfully

REM Step 3: Deploy to Cloud Run
echo.
echo 🚀 Step 3/3: Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
  --image %IMAGE% ^
  --region %REGION% ^
  --platform managed ^
  --allow-unauthenticated ^
  --port 8080 ^
  --memory 512Mi ^
  --timeout 300 ^
  --max-instances 10 ^
  --set-env-vars NODE_ENV=production,PORT=8080 ^
  --set-secrets DATABASE_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cloud Run deployment failed
    echo.
    echo Common issues:
    echo   1. Secrets not created (DATABASE_URL, JWT_SECRET)
    echo   2. Cloud Run API not enabled
    echo   3. Insufficient permissions
    echo.
    echo See CLOUD_RUN_DEPLOYMENT_GUIDE.md for troubleshooting
    exit /b 1
)

echo.
echo ✅ Deployment successful!
echo.

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i

echo 🎉 Your app is live at:
echo    %SERVICE_URL%
echo.
echo 📊 View logs:
echo    gcloud run services logs tail %SERVICE_NAME% --region %REGION%
echo.
echo 🔍 Check status:
echo    gcloud run services describe %SERVICE_NAME% --region %REGION%
echo.

pause
