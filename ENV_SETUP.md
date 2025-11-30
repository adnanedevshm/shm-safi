# Environment Configuration Guide

## Overview
This project uses environment variables for configuring Supabase, Twilio, and server settings. The configuration is handled through a `.env` file in the project root.

## Environment Variables

### Required (Core Functionality)

#### Supabase Configuration
- `SUPABASE_URL`: Your Supabase project URL
  - Example: `https://zjpqhlzmdqwihykyuxrt.supabase.co`
  - Used by: Server-side authentication and database operations
  - Routes affected: `/api/register`, `/api/login`, `/api/user`, `/api/score`, etc.

- `SUPABASE_SERVICE_ROLE`: Service role key for server-side operations
  - Used for: Database mutations and admin operations
  - Routes affected: All server API endpoints that modify data

- `SUPABASE_ANON_KEY`: Anonymous key for client-side operations
  - Used for: Public API access (currently not actively used in server code)
  - Can be safely exposed to the client

### Optional (Feature-Specific)

#### Twilio Configuration (WhatsApp Feature)
Required only if using the `/api/idees` endpoint for sending WhatsApp messages.
- `TWILIO_SID`: Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Twilio Auth Token
- `TWILIO_FROM`: Sender WhatsApp number (format: `+1234567890`)
- `TWILIO_TO`: Recipient WhatsApp number (format: `+1234567890`)

### Development/Server Configuration

- `PORT`: Server port (default: 3000)
- `PING_MESSAGE`: Message returned by `/api/ping` endpoint (default: "ping")
- `VITE_API_BASE`: Client-side API base URL (optional, defaults to `window.location.origin`)

## Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   - Get these from your Supabase project settings
   - Visit: https://app.supabase.com → Project Settings → API

3. (Optional) Add Twilio credentials if using WhatsApp feature:
   - Get these from your Twilio account dashboard

4. In development, environment variables are loaded automatically from `.env` via `dotenv/config`

5. In production (Netlify/Vercel), set environment variables in your deployment platform:
   - For Netlify: Site settings → Build & Deploy → Environment
   - For Vercel: Project Settings → Environment Variables

## How Environment Variables Are Used

### Server-Side (Node.js)
- Loaded via `dotenv/config` import in `server/index.ts`
- Available through `process.env.VARIABLE_NAME`
- Used in all API routes for authentication and database access

### Client-Side (React)
- Only variables prefixed with `VITE_` are exposed to the client
- Accessed via `import.meta.env.VITE_VARIABLE_NAME`
- Currently uses `VITE_API_BASE` for API endpoint configuration
- Falls back to `window.location.origin` if not defined

## Validation

The `/api/debug/supabase` endpoint shows the status of Supabase configuration:
```
GET /api/debug/supabase
```

Response:
```json
{
  "SUPABASE_URL": true/false,
  "SUPABASE_SERVICE_ROLE_set": true/false,
  "SUPABASE_ANON_KEY_set": true/false
}
```

## Troubleshooting

### "Supabase configuration missing on server" Error
- Check that `.env` file exists in project root
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` are set
- Check for typos or missing values
- Restart the development server after changing `.env`

### API Endpoints Return 500 Errors
- Check server logs for specific error messages
- Visit `/api/debug/supabase` to verify configuration
- Ensure Supabase credentials are correct
- Verify database tables exist (app_users, users, etc.)

### "Twilio not configured on server" Error
- This error is expected if Twilio variables aren't set
- Only required for `/api/idees` endpoint (WhatsApp feature)
- Either set Twilio variables or skip using that endpoint

## Security Notes

- Never commit `.env` file to version control (it's in .gitignore)
- Keep `SUPABASE_SERVICE_ROLE` and `TWILIO_AUTH_TOKEN` confidential
- In production, use platform-specific secret management (Netlify/Vercel environment variables)
- Don't log or expose these variables in error messages (current code already does this)
