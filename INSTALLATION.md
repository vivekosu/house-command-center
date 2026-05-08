# Installation Guide

## Prerequisites
- Node.js 18+ (download from nodejs.org)
- Free Supabase account (supabase.com)
- Free Vercel account (vercel.com)

## Step 1 — Supabase setup
1. supabase.com → New project → name it house-command-center
2. SQL Editor → paste supabase/schema.sql → Run
3. Edit supabase/seed.sql with your real names and phones
4. SQL Editor → paste supabase/seed.sql → Run
5. Storage → New bucket → name: site-photos → Public: ON
6. Settings → API → copy Project URL and anon key

## Step 2 — Fill in .env
  cp .env.example .env
Edit .env and paste your Supabase URL and anon key.

Get your project ID:
  In Supabase SQL Editor run: select id from projects limit 1;
  Copy the UUID and paste into VITE_PROJECT_ID in .env

## Step 3 — Run locally
  npm install
  npm run dev
Open http://localhost:5173

## Step 4 — Add full page code
The page files in src/pages/ are stubs.
Copy the full code for each page from the Claude conversation
and replace the stub content.

## Step 5 — Deploy to Vercel
1. vercel.com → New project → Import this folder
2. Add the 4 environment variables from your .env
3. Deploy (takes 60 seconds)
4. Copy the Vercel URL and update VITE_APP_URL in Vercel settings
5. Redeploy

## Step 6 — Share access links
- Open app → Config tab → Team → Copy link for each person
- Config → Vendors → Vendor link for each vendor
- Send links via WhatsApp

## Step 7 — Install as PWA on phones
Android: Chrome menu → Add to Home screen
iPhone: Safari share → Add to Home Screen
