# Deployment Guide - Cloudflare Pages

## Step 1: Push to GitHub ✅

### Commands to run:
```bash
# Add all files
git add .

# Commit changes
git commit -m "Add Cloudflare Pages Functions with D1 and R2"

# Push to GitHub
git push origin main
```

## Step 2: Create Cloudflare Pages Project

### Via Dashboard:
1. Go to https://dash.cloudflare.com
2. Click **Pages** → **Create a project**
3. Click **Connect to Git**
4. Select repository: `fowtaa2025/Tsharok`
5. Configure build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `public`
   - **Root directory:** (leave empty)

### Environment Variables:
Add these in the Pages dashboard:
```
R2_PUBLIC_URL = https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev
JWT_SECRET = [Generate a secure random string]
```

### Bindings:
1. **R2 Bucket:**
   - Variable name: `R2_BUCKET`
   - Bucket: `btsharok`

2. **D1 Database:**
   - Variable name: `DB`
   - Database: `tsharok-db`

## Step 3: Deploy Production Database

After Pages project is created, apply schema to production:

```bash
# Apply schema to production D1
npx wrangler d1 execute tsharok-db --remote --file=schema.sql

# Add seed data to production
npx wrangler d1 execute tsharok-db --remote --file=seed.sql
```

## Step 4: Verify Deployment

Your site will be available at:
```
https://tsharok.pages.dev
```

Test endpoints:
```
https://tsharok.pages.dev/api/courses
https://tsharok.pages.dev/api/auth
```

## Troubleshooting

### If deployment fails:
1. Check build logs in Cloudflare dashboard
2. Verify all bindings are configured
3. Ensure environment variables are set
4. Check that schema was applied to production D1

### If APIs don't work:
1. Check Functions logs in dashboard
2. Verify D1 database has data
3. Test with curl/Postman
4. Check CORS headers

## Custom Domain (Optional)

To add a custom domain:
1. Go to Pages project → Custom domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate

---

**Ready to deploy!** 🚀
