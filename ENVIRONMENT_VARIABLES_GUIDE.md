# Environment Variables Setup Guide

## 🎯 Client-Side Environment Variables

### ❌ **YOU DON'T NEED TO SET CLIENT ENV IN VERCEL!**

The client-side environment variables are **already configured automatically**:

- **Development** (local): Uses `client/.env` → `http://localhost:5000/api`
- **Production** (Vercel): Uses `client/.env.production` → `/api` (relative path)

### Why No Client Env Needed in Vercel?

The production build automatically uses **relative URLs** (`/api`) which are proxied to your backend by Vercel's rewrites. This means:

✅ **Frontend**: `https://your-app.vercel.app/`  
✅ **API**: `https://your-app.vercel.app/api/...`  
✅ Both served from the same domain - **no CORS issues!**

### Files Already Configured:

**`client/.env`** (for local development):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**`client/.env.production`** (auto-used in production):
```env
REACT_APP_API_URL=/api
REACT_APP_ENVIRONMENT=production
```

---

## 🔧 Server-Side Environment Variables (Required in Vercel)

These **MUST** be added in Vercel Dashboard after deployment.

### How to Add Environment Variables in Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project: **haazir-attendance-system**
3. Click **Settings** → **Environment Variables**
4. Add each variable below
5. Select **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your project

---

## 📝 Required Server Environment Variables

### 1. Database Configuration ⚠️ **CRITICAL**

```
Variable: DATABASE_URL
Value: postgresql://user:password@host:5432/haazir
Environment: Production, Preview, Development
```

**Where to get this:**
- **Supabase**: Project Settings → Database → Connection String (URI)
- **Neon**: Dashboard → Connection String
- **Vercel Postgres**: Auto-added when you run `vercel postgres create`

**Example:**
```
postgresql://postgres:yourpassword@db.example.supabase.co:5432/postgres
```

---

### 2. Authentication Secrets ⚠️ **CRITICAL**

#### JWT_SECRET
```
Variable: JWT_SECRET
Value: <generate-a-secure-random-string-at-least-32-characters>
Environment: Production, Preview, Development
```

**How to generate (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

**Example Output:**
```
aB3dE7gH2jK9mN4pQ8rS5tV1wX6yZ0cF2hJ8
```

#### SESSION_SECRET
```
Variable: SESSION_SECRET
Value: <another-secure-random-string>
Environment: Production, Preview, Development
```

**Generate again using the same command above.**

---

### 3. CORS Configuration ⚠️ **IMPORTANT**

#### FRONTEND_URL
```
Variable: FRONTEND_URL
Value: https://your-deployment-url.vercel.app
Environment: Production, Preview, Development
```

**Note:** After first deployment, Vercel gives you a URL like:
- `https://haazir-attendance-system.vercel.app`
- Copy this URL and add it here
- Then **redeploy**

#### CORS_ORIGIN
```
Variable: CORS_ORIGIN
Value: https://your-deployment-url.vercel.app
Environment: Production, Preview, Development
```

**Same value as FRONTEND_URL.**

---

### 4. Server Configuration

#### NODE_ENV
```
Variable: NODE_ENV
Value: production
Environment: Production
```

#### PORT
```
Variable: PORT
Value: 5000
Environment: Production, Preview, Development
```

---

### 5. JWT Expiration (Optional)

```
Variable: JWT_EXPIRES_IN
Value: 7d
Environment: Production, Preview, Development
```

---

## 🗄️ Optional: Supabase Variables

If you're using Supabase for storage/additional features:

```
Variable: SUPABASE_URL
Value: https://xxxxx.supabase.co
Environment: Production, Preview, Development

Variable: SUPABASE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development

Variable: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```

---

## 📋 Complete Environment Variables Checklist

### ✅ Required (Must Add in Vercel):

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - 32+ character random string
- [ ] `SESSION_SECRET` - 32+ character random string
- [ ] `FRONTEND_URL` - Your Vercel deployment URL
- [ ] `CORS_ORIGIN` - Your Vercel deployment URL
- [ ] `NODE_ENV` - Set to `production`

### ✅ Optional but Recommended:

- [ ] `PORT` - Set to `5000`
- [ ] `JWT_EXPIRES_IN` - Set to `7d`

### ❌ NOT Needed in Vercel:

- ❌ `REACT_APP_API_URL` - Already configured in code
- ❌ `REACT_APP_ENVIRONMENT` - Already configured in code

---

## 🚀 Step-by-Step Deployment Process

### Step 1: First Deployment (Without All Env Variables)

```powershell
vercel
```

This will deploy your app and give you a URL like:
```
https://haazir-attendance-system-abc123.vercel.app
```

**⚠️ App won't work yet - that's expected!**

---

### Step 2: Set Up Database

**Option A: Vercel Postgres**
```powershell
vercel postgres create
```
This automatically adds `DATABASE_URL` and related variables.

**Option B: Supabase**
1. Go to https://supabase.com
2. Create new project: "haazir"
3. Wait 2 minutes for setup
4. Go to Project Settings → Database
5. Copy "Connection String" (URI format)
6. Replace `[YOUR-PASSWORD]` with your actual password

---

### Step 3: Generate Secrets

**PowerShell Command:**
```powershell
# Generate JWT_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})

# Run again for SESSION_SECRET
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

**Save both outputs** - you'll need them!

---

### Step 4: Add Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Click your project
3. Settings → Environment Variables
4. Add these **6 required variables**:

```
DATABASE_URL = postgresql://...
JWT_SECRET = aB3dE7gH2jK9...
SESSION_SECRET = mN4pQ8rS5tV1...
FRONTEND_URL = https://haazir-attendance-system-abc123.vercel.app
CORS_ORIGIN = https://haazir-attendance-system-abc123.vercel.app
NODE_ENV = production
```

For each variable:
- Click **Add New**
- Enter **Key** (variable name)
- Enter **Value**
- Select **Production**, **Preview**, **Development**
- Click **Save**

---

### Step 5: Redeploy

**Via Dashboard:**
1. Go to Deployments tab
2. Click latest deployment
3. Click "Redeploy"

**Via CLI:**
```powershell
vercel --prod
```

---

### Step 6: Test Your Deployment

**Test Backend API:**
```powershell
curl https://your-app.vercel.app/api/health
```

**Expected Response:**
```json
{"status":"OK","timestamp":"2025-10-20T..."}
```

**Test Frontend:**
1. Open https://your-app.vercel.app
2. Try registering/logging in
3. Check browser console (F12) for errors
4. Verify API calls work

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to database"

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database allows connections from `0.0.0.0/0` (all IPs)
3. Ensure SSL is enabled in Supabase/Neon

### Issue: "Invalid token" or authentication errors

**Solution:**
1. Verify `JWT_SECRET` is set
2. Make sure it's at least 32 characters
3. Redeploy after adding it

### Issue: CORS errors

**Solution:**
1. Add your Vercel URL to `FRONTEND_URL` and `CORS_ORIGIN`
2. Make sure there's no trailing slash
3. Redeploy

### Issue: "Cannot read environment variable"

**Solution:**
1. Verify variable name is spelled correctly (case-sensitive)
2. Check it's added for "Production" environment
3. Redeploy after adding variables

---

## 🔒 Security Best Practices

### ✅ DO:
- Generate strong random secrets (40+ characters)
- Use different secrets for JWT and SESSION
- Keep secrets private - never commit to Git
- Rotate secrets periodically (every 3-6 months)
- Use Vercel's built-in secrets management

### ❌ DON'T:
- Use simple passwords like "password123"
- Share secrets publicly
- Commit .env files to GitHub
- Use same secret for multiple purposes
- Hardcode secrets in your code

---

## 📊 Environment Variables Summary Table

| Variable | Required? | Where to Set | Example Value |
|----------|-----------|--------------|---------------|
| `REACT_APP_API_URL` | ❌ No | Auto-configured | `/api` |
| `DATABASE_URL` | ✅ Yes | Vercel Dashboard | `postgresql://...` |
| `JWT_SECRET` | ✅ Yes | Vercel Dashboard | `aB3dE7gH2jK9...` |
| `SESSION_SECRET` | ✅ Yes | Vercel Dashboard | `mN4pQ8rS5tV1...` |
| `FRONTEND_URL` | ✅ Yes | Vercel Dashboard | `https://your-app.vercel.app` |
| `CORS_ORIGIN` | ✅ Yes | Vercel Dashboard | `https://your-app.vercel.app` |
| `NODE_ENV` | ✅ Yes | Vercel Dashboard | `production` |
| `PORT` | ⚠️ Optional | Vercel Dashboard | `5000` |
| `JWT_EXPIRES_IN` | ⚠️ Optional | Vercel Dashboard | `7d` |

---

## 🎯 Quick Setup Commands

```powershell
# 1. Deploy first time
vercel

# 2. Create database (if using Vercel Postgres)
vercel postgres create

# 3. Generate secrets
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})

# 4. Add environment variables in dashboard (manual step)

# 5. Redeploy with env variables
vercel --prod

# 6. Check logs
vercel logs --follow

# 7. Test API
curl https://your-app.vercel.app/api/health
```

---

## ✅ Final Checklist

Before going live:

- [ ] Database created and accessible
- [ ] All 6 required environment variables added in Vercel
- [ ] Secrets are strong (40+ characters)
- [ ] FRONTEND_URL matches your deployment URL
- [ ] Redeployed after adding variables
- [ ] API health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] Login/registration works
- [ ] Face recognition models load
- [ ] No CORS errors in browser console

---

**🎉 Once all checkboxes are complete, your Haazir app is production-ready!**
