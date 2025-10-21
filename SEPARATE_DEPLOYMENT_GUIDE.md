# 🚀 Separate Deployment Guide - Frontend & Backend

This guide explains how to deploy the Haazir application with **separate deployments** for frontend and backend on Vercel.

## 📋 Prerequisites

- GitHub repository: `amitesh-7/Haazir`
- Vercel account linked to your GitHub
- Supabase PostgreSQL database ready

---

## 🎯 Deployment Strategy

```
Frontend (React)  →  Vercel Project 1  →  https://haazir-frontend.vercel.app
Backend (Node.js) →  Vercel Project 2  →  https://haazir-backend.vercel.app
```

---

## 📦 Part 1: Deploy Backend

### Step 1: Create New Vercel Project for Backend

1. Go to https://vercel.com/new
2. Select your GitHub repository: `amitesh-7/Haazir`
3. Configure the project:
   - **Project Name**: `haazir-backend` (or any name you prefer)
   - **Framework Preset**: `Other`
   - **Root Directory**: Click "Edit" → Select `server` folder ✅
   - **Build Command**: Leave empty (uses package.json script)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

### Step 2: Add Backend Environment Variables

Click on "Environment Variables" and add these **7 variables**:

```env
DATABASE_URL=postgresql://postgres:Amitesh-1710@db.ghzwwpvmdefvtmrfrgnd.supabase.co:5432/postgres?sslmode=require

JWT_SECRET=<your-generated-jwt-secret>

SESSION_SECRET=<your-generated-session-secret>

NODE_ENV=production

PORT=5000

FRONTEND_URL=https://haazir-frontend.vercel.app

CORS_ORIGIN=https://haazir-frontend.vercel.app
```

**Important Notes:**
- ⚠️ `FRONTEND_URL` and `CORS_ORIGIN` will be updated after frontend deployment
- 🔑 Use the secrets you generated earlier for `JWT_SECRET` and `SESSION_SECRET`

### Step 3: Deploy Backend

Click **"Deploy"** button.

Wait for deployment to complete (2-3 minutes).

### Step 4: Get Backend URL

After deployment, copy your backend URL. It will be something like:
```
https://haazir-backend-xyz123.vercel.app
```

### Step 5: Update CORS Settings

Go back to **Settings** → **Environment Variables** and update:
- `FRONTEND_URL`: (wait for frontend deployment)
- `CORS_ORIGIN`: (wait for frontend deployment)

---

## 🎨 Part 2: Deploy Frontend

### Step 1: Create New Vercel Project for Frontend

1. Go to https://vercel.com/new
2. Select your GitHub repository: `amitesh-7/Haazir` (again)
3. Configure the project:
   - **Project Name**: `haazir-frontend` (or any name)
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click "Edit" → Select `client` folder ✅
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)
   - **Install Command**: `npm install`

### Step 2: Add Frontend Environment Variable

Click on "Environment Variables" and add **1 variable**:

```env
REACT_APP_API_URL=https://haazir-backend-xyz123.vercel.app/api
```

⚠️ **Replace** `haazir-backend-xyz123.vercel.app` with your actual backend URL from Part 1.

### Step 3: Deploy Frontend

Click **"Deploy"** button.

Wait for deployment to complete (2-3 minutes).

### Step 4: Get Frontend URL

After deployment, copy your frontend URL:
```
https://haazir-frontend-abc456.vercel.app
```

---

## 🔄 Part 3: Update Backend CORS

Now that you have the frontend URL, update backend environment variables:

1. Go to your **backend project** in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Update these 2 variables:
   ```env
   FRONTEND_URL=https://haazir-frontend-abc456.vercel.app
   CORS_ORIGIN=https://haazir-frontend-abc456.vercel.app
   ```
4. Go to **Deployments** tab
5. Click the latest deployment → Three dots (...) → **"Redeploy"**
6. ✅ Check "Use existing Build Cache"
7. Click **"Redeploy"**

---

## ✅ Part 4: Test Your Deployment

### Test Backend API

Open this URL in browser:
```
https://haazir-backend-xyz123.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-10-21T...",
  "database": "connected",
  "environment": "production"
}
```

### Test Frontend

Open this URL in browser:
```
https://haazir-frontend-abc456.vercel.app
```

Expected: Your React app should load and be able to make API calls.

---

## 🎉 Summary

### Your Deployed URLs:

| Service  | URL |
|----------|-----|
| Frontend | `https://haazir-frontend-abc456.vercel.app` |
| Backend  | `https://haazir-backend-xyz123.vercel.app` |
| API      | `https://haazir-backend-xyz123.vercel.app/api` |

### Environment Variables Summary:

**Backend (7 variables):**
```env
DATABASE_URL=postgresql://postgres:Amitesh-1710@db.ghzwwpvmdefvtmrfrgnd.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=<your-secret>
SESSION_SECRET=<your-secret>
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://haazir-frontend-abc456.vercel.app
CORS_ORIGIN=https://haazir-frontend-abc456.vercel.app
```

**Frontend (1 variable):**
```env
REACT_APP_API_URL=https://haazir-backend-xyz123.vercel.app/api
```

---

## 🔧 Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` and `CORS_ORIGIN` match exactly (no trailing slash)
- Redeploy backend after updating CORS variables

### 500 Internal Server Error
- Check backend deployment logs in Vercel
- Verify `DATABASE_URL` is correct
- Ensure all 7 backend environment variables are set

### API Connection Failed
- Verify `REACT_APP_API_URL` in frontend points to correct backend URL
- Backend URL must include `/api` at the end
- Check backend is deployed and running

### Build Failures
- Frontend: Make sure `client` folder is selected as Root Directory
- Backend: Make sure `server` folder is selected as Root Directory
- Both: Check deployment logs for specific errors

---

## 📝 Future Updates

When you push code to GitHub:
- Frontend changes → Auto-deploys to frontend project
- Backend changes → Auto-deploys to backend project
- Both are independent and won't affect each other

---

## 🎯 Benefits of Separate Deployment

✅ **Easier to Debug** - Separate logs for frontend/backend  
✅ **Independent Scaling** - Scale frontend and backend separately  
✅ **Clearer Configuration** - Each project has its own settings  
✅ **No Monorepo Complexity** - Avoids routing and build issues  
✅ **Standard Approach** - Most common deployment pattern

---

**Need Help?** Check the deployment logs in Vercel dashboard for detailed error messages.
