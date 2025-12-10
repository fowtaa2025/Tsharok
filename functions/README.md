# Tsharok Cloudflare Functions

This directory contains the backend API implemented as Cloudflare Pages Functions.

## Structure

```
functions/
├── api/
│   ├── upload.ts          # File upload to R2
│   ├── auth.ts            # Authentication (login/register)
│   ├── courses.ts         # Courses API
│   └── _middleware.ts     # CORS and auth middleware
```

## Development

Run locally:
```bash
npm run dev
```

Deploy:
```bash
npm run deploy
```
