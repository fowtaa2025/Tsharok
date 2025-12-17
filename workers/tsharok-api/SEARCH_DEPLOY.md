# Search Migration - Deployment Instructions

## Step 1: Add Handler Functions to Worker

1. Open `c:\xampp\htdocs\Tsharok\workers\tsharok-api\src\index.ts`
2. Scroll to the **end of the file** (after all other handler functions)
3. Open `c:\xampp\htdocs\Tsharok\workers\tsharok-api\src\search-handlers.ts`
4. **Copy all content** from `search-handlers.ts`
5. **Paste** at the end of `index.ts` (before the closing brace)
6. **Save** `index.ts`

## Step 2: Deploy Worker

In PowerShell:
```powershell
cd c:\xampp\htdocs\Tsharok\workers\tsharok-api
npm run deploy
```

## Step 3: Test

After deployment, test in browser:
- Go to your site search boxType something and check if autocomplete works
- Submit a search
- Try filters (category, level, rating)

## What Was Changed

**Worker Routes Added:**
- `GET /api/search`
- `GET /api/search/suggestions`  
- `GET /api/search/filters`

**Frontend Updated:**
- `search.js` now calls Worker instead of PHP

That's it! 🎉
