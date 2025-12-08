# Cloudflare R2 Storage Integration - Setup Guide

## Quick Start

### 1. Install AWS SDK for PHP

The R2 integration requires the AWS SDK for PHP (Cloudflare R2 is S3-compatible).

**Option A: Using Composer (Recommended)**
```bash
cd c:\xampp\htdocs\Tsharok
composer require aws/aws-sdk-php
```

**Option B: Manual Installation**
If Composer is not available, download the AWS SDK manually:
1. Download from: https://github.com/aws/aws-sdk-php/releases
2. Extract to `vendor/aws/` directory

### 2. Configure R2 Credentials

**Option A: Using Setup Script (Easy)**
```bash
cd c:\xampp\htdocs\Tsharok
setup-r2.bat
```

**Option B: Manual Configuration**
1. Copy `.env.example` to `.env`
2. Edit `.env` and fill in your R2 credentials:

```env
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=your_bucket_name_here
USE_R2_STORAGE=true
```

### 3. Get Your R2 Credentials

1. **Log into Cloudflare Dashboard**: https://dash.cloudflare.com/
2. **Navigate to R2**: Click on "R2" in the left sidebar
3. **Get Account ID**: Found in the URL (e.g., `cacc345babec167307a640875c870348`)
4. **Create API Token**:
   - Click "Manage R2 API Tokens"
   - Click "Create API Token"
   - Give it a name (e.g., "Tsharok Upload")
   - Set permissions: "Object Read & Write"
   - Click "Create API Token"
   - **Save the Access Key ID and Secret Access Key** (you won't see the secret again!)
5. **Create or Select Bucket**:
   - Go to R2 → Overview
   - Create a new bucket or use an existing one
   - Note the bucket name

### 4. Test Connection

```bash
cd c:\xampp\htdocs\Tsharok
C:\xampp\php\php.exe tests\test-r2-connection.php
```

If successful, you'll see:
```
✓ R2 Connection Test PASSED
Your R2 storage is configured correctly!
```

### 5. Enable R2 Storage

In your `.env` file, set:
```env
USE_R2_STORAGE=true
```

That's it! New file uploads will now go to Cloudflare R2.

---

## How It Works

### File Upload Flow

1. **User uploads file** → Frontend sends to `api/file-upload-handler.php`
2. **File is staged** → Temporarily stored in `uploads/staging/`
3. **File is processed** → Images are optimized, thumbnails created
4. **File is uploaded to R2** → Uploaded to Cloudflare R2 bucket
5. **Staged file is deleted** → Temporary file removed
6. **URL is returned** → R2 URL sent back to frontend

### Fallback Behavior

If R2 upload fails for any reason:
- Automatically falls back to local storage
- File is saved in `uploads/content/` (or profiles/thumbnails)
- Error is logged for debugging
- Upload still succeeds for the user

### Storage Types

Files are tracked with a `storage_type` field:
- `r2` - File is stored in Cloudflare R2
- `local` - File is stored locally

---

## Configuration Options

### .env Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `R2_ACCOUNT_ID` | Your Cloudflare Account ID | Yes | - |
| `R2_ACCESS_KEY_ID` | R2 API Access Key ID | Yes | - |
| `R2_SECRET_ACCESS_KEY` | R2 API Secret Access Key | Yes | - |
| `R2_BUCKET_NAME` | R2 Bucket name | Yes | - |
| `R2_REGION` | R2 Region | No | `auto` |
| `USE_R2_STORAGE` | Enable/disable R2 | No | `false` |
| `R2_PUBLIC_URL` | Public URL for bucket | No | - |

### R2 Public URL (Optional)

If you want files to be publicly accessible without signed URLs:

1. **Make bucket public** in Cloudflare R2 dashboard
2. **Get public URL** (e.g., `https://pub-xxxxx.r2.dev`)
3. **Set in .env**: `R2_PUBLIC_URL=https://pub-xxxxx.r2.dev`

Otherwise, files will use signed URLs for access.

---

## Troubleshooting

### "AWS SDK for PHP is not installed"

**Solution**: Install the AWS SDK:
```bash
composer require aws/aws-sdk-php
```

### "R2 configuration invalid"

**Solution**: Check your `.env` file and ensure all required variables are set.

### "Connection test failed"

**Possible causes**:
- Incorrect credentials
- Bucket doesn't exist
- API token doesn't have correct permissions
- Network/firewall issues

**Solution**: Double-check credentials in Cloudflare dashboard.

### "R2 storage is currently DISABLED"

**Solution**: Set `USE_R2_STORAGE=true` in `.env` file.

### Files still going to local storage

**Check**:
1. Is `USE_R2_STORAGE=true` in `.env`?
2. Did you restart the web server after changing `.env`?
3. Check error logs in `logs/` directory

---

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` file to version control
- `.env` is already in `.gitignore`
- Keep your R2 credentials secret
- Rotate API tokens periodically

---

## Cost Information

Cloudflare R2 Pricing (as of 2024):
- **Storage**: $0.015 per GB/month
- **Class A Operations** (writes): $4.50 per million
- **Class B Operations** (reads): $0.36 per million
- **Egress**: FREE (no bandwidth charges!)

R2 is significantly cheaper than AWS S3, especially for high-traffic sites.

---

## Next Steps

Once R2 is configured:
1. Upload a test file through your application
2. Verify it appears in R2 dashboard
3. Check that file preview/download works
4. Monitor logs for any errors

For questions or issues, check the error logs in `logs/` directory.
