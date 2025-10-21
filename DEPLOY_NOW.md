# 🚀 QUICK START - Separate Deployment

## 📌 TL;DR - Do This Now:

### 1️⃣ Deploy Backend (5 minutes)

1. Go to: https://vercel.com/new
2. Select: `amitesh-7/Haazir` repository
3. **Root Directory**: `server` ⬅️ **IMPORTANT!**
4. Add these 7 environment variables:
   ```
   DATABASE_URL=postgresql://postgres:Amitesh-1710@db.ghzwwpvmdefvtmrfrgnd.supabase.co:5432/postgres?sslmode=require
   JWT_SECRET=(your generated secret)
   SESSION_SECRET=(your generated secret)
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://temporary.com
   CORS_ORIGIN=https://temporary.com
   ```
5. Click **Deploy**
6. **COPY YOUR BACKEND URL** (e.g., `https://haazir-backend.vercel.app`)

---

### 2️⃣ Deploy Frontend (5 minutes)

1. Go to: https://vercel.com/new (again)
2. Select: `amitesh-7/Haazir` repository (same repo, different project)
3. **Root Directory**: `client` ⬅️ **IMPORTANT!**
4. Add this 1 environment variable:
   ```
   REACT_APP_API_URL=https://YOUR-BACKEND-URL-FROM-STEP-1/api
   ```
   (Replace with actual backend URL from step 1)
5. Click **Deploy**
6. **COPY YOUR FRONTEND URL** (e.g., `https://haazir-frontend.vercel.app`)

---

### 3️⃣ Update Backend CORS (2 minutes)

1. Go to your **backend project** in Vercel
2. Settings → Environment Variables
3. **Edit** these 2 variables:
   ```
   FRONTEND_URL=https://YOUR-FRONTEND-URL-FROM-STEP-2
   CORS_ORIGIN=https://YOUR-FRONTEND-URL-FROM-STEP-2
   ```
4. Go to **Deployments** tab → Click latest → **Redeploy**

---

## ✅ Done! Test Your App:

**Frontend**: Open your frontend URL in browser  
**Backend**: Visit `https://your-backend-url.vercel.app/api/health`

---

## 🆘 Need More Details?

Read the full guide: `SEPARATE_DEPLOYMENT_GUIDE.md`

---

## 🔑 Your Generated Secrets:

Run this in PowerShell to get new secrets if needed:
```powershell
# JWT_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})

# SESSION_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

---

## 📊 What You're Deploying:

```
┌─────────────────────────────────────┐
│  Vercel Project 1: Backend          │
│  Root Dir: server/                  │
│  URL: haazir-backend.vercel.app     │
│  Env Vars: 7                        │
└─────────────────────────────────────┘
              ↓ API calls
┌─────────────────────────────────────┐
│  Vercel Project 2: Frontend         │
│  Root Dir: client/                  │
│  URL: haazir-frontend.vercel.app    │
│  Env Vars: 1                        │
└─────────────────────────────────────┘
```

**Each deployment is independent and easier to manage!**
