# 🔥 Backend Deployment - 500 Error Fix

## Common Causes of 500 Internal Server Error

### 1. Missing Environment Variables ⚠️ **MOST COMMON**

Your backend needs these environment variables in Vercel:

#### Add These in Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Select your **backend project**
3. Settings → Environment Variables
4. Add each variable below:

```
DATABASE_URL = postgresql://postgres:Amitesh-1710@db.ghzwwpvmdefvtmrfrgnd.supabase.co:5432/postgres?sslmode=require

JWT_SECRET = <generate-40-char-random-string>

SESSION_SECRET = <generate-40-char-random-string>

FRONTEND_URL = <your-frontend-vercel-url>

CORS_ORIGIN = <your-frontend-vercel-url>

NODE_ENV = production

PORT = 5000
```

**Generate secrets:**

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 40 | ForEach-Object {[char]$_})
```

---

### 2. TypeScript Build Issue

The current `server/vercel.json` expects TypeScript to work directly, but Vercel needs the compiled JavaScript.

**Fix Option 1: Use built output**

Update `server/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/app_clean.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/app_clean.js"
    }
  ]
}
```

**Fix Option 2: Use TypeScript directly (simpler)**

Keep current `server/vercel.json` but ensure `@vercel/node` handles TypeScript:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app_clean.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app_clean.ts"
    }
  ]
}
```

---

### 3. Module Import Issues

Vercel serverless needs CommonJS or properly configured ES modules.

**Quick Fix:** Update `server/package.json`:

```json
{
  "type": "commonjs",
  "main": "src/app_clean.ts"
}
```

---

## 🚀 Quick Fix Steps

### Step 1: Check Vercel Logs

```powershell
vercel logs <your-backend-project-name> --follow
```

This will show you the exact error.

### Step 2: Add Environment Variables

Go to Vercel Dashboard → Your Backend Project → Settings → Environment Variables

Add all 7 variables listed above.

### Step 3: Update server/vercel.json

Use this configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app_clean.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app_clean.ts"
    }
  ]
}
```

### Step 4: Redeploy

```powershell
cd server
vercel --prod
```

---

## 🐛 Debugging Steps

### 1. Check Build Logs

Go to Vercel Dashboard → Deployments → Click latest deployment → Build Logs

Look for errors like:

- "Cannot find module..."
- "Missing environment variable..."
- "TypeScript compilation error..."

### 2. Test Locally First

```powershell
cd server
npm run build
node dist/app_clean.js
```

If this works locally, the issue is environment variables in Vercel.

### 3. Check Function Logs

Vercel Dashboard → Deployments → Runtime Logs

Look for:

- Database connection errors
- Missing env variables
- CORS errors

---

## 🔍 Common Error Messages & Fixes

### "Cannot connect to database"

**Fix:**

- Add `DATABASE_URL` in Vercel environment variables
- Ensure Supabase allows connections from `0.0.0.0/0`

### "Invalid JWT secret"

**Fix:**

- Add `JWT_SECRET` environment variable
- Make it 40+ characters

### "CORS policy error"

**Fix:**

- Add `FRONTEND_URL` and `CORS_ORIGIN` with your frontend URL
- No trailing slash: `https://your-frontend.vercel.app`

### "Cannot find module 'express'"

**Fix:**

- Ensure all runtime dependencies are in `dependencies`, not `devDependencies`
- Redeploy

---

## ✅ Complete Backend vercel.json

Use this exact configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app_clean.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app_clean.ts"
    }
  ]
}
```

---

## 🎯 Quick Deployment Checklist

- [ ] Environment variables added in Vercel Dashboard (7 total)
- [ ] `server/vercel.json` uses correct configuration
- [ ] TypeScript dependencies in `dependencies` (not devDependencies)
- [ ] `export default app` exists in `app_clean.ts` ✅ (already done)
- [ ] Redeployed after adding env variables
- [ ] Checked Vercel logs for specific error

---

## 💡 Pro Tips

1. **Always check logs first:**

   ```powershell
   vercel logs --follow
   ```

2. **Test health endpoint:**

   ```powershell
   curl https://your-backend.vercel.app/api/health
   ```

3. **Environment variables need redeploy:**
   After adding env vars, always redeploy!

4. **Separate frontend and backend:**
   If deployed separately, make sure:
   - Backend CORS allows frontend URL
   - Frontend API URL points to backend URL

---

## 🆘 Still Getting 500 Error?

Run these commands and share the output:

```powershell
# Get detailed logs
vercel logs <your-project> --follow

# Check deployment status
vercel ls

# Inspect specific deployment
vercel inspect <deployment-url>
```

Most likely fix: **Add environment variables in Vercel Dashboard and redeploy!**
