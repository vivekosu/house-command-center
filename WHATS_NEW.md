# What was added in this update

## ✅ NEW: Pick from phone contacts
- **Config → Team → "+ Add team member (from contacts)"** opens phone book picker
- **Config → Vendors → "+ Add vendor (from contacts)"** opens phone book picker
- **Vendors → + Add → "📱 Pick from phone contacts"** button at top of form
- Auto-fills **name** and **phone** from your selected contact
- Falls back to manual entry on iPhone or unsupported browsers

⚠️ **Phone contact picker requirements:**
- Works on **Chrome for Android** over **HTTPS** (Vercel = HTTPS, so works in production)
- **Does NOT work on iPhone Safari** (Apple has not implemented the Contact Picker API)
- On iPhone you'll see manual name/phone fields — type them by hand
- On localhost (http) it won't work either; deploy to Vercel to test

## ✅ NEW: Notes screen
- New **Notes** tab in bottom navigation (replaced Photos — Photos still in Config)
- See **all notes across all tasks and vendors** in one feed
- Filter: All / Task notes / Vendor notes
- **+ Add** button: pick task or vendor → type or speak → save
- 🎤 **Voice note** button uses Web Speech API (Chrome Android / Safari iOS, Hindi+English)
- Tap any note to jump to its task or vendor

## ✅ NEW: Config screen revamp
- Add team member button (with contact picker)
- Add vendor button (with contact picker)
- Team grouped by role (Owner, Family, Supervisor, Architect, Designer, Controller)
- Account tab now has shortcuts to: Templates, Notes, Photos, Clarifications, Promises, WhatsApp

## 🛠 If you see "data is empty"

Most likely cause: **seed.sql was not run**, or was run on the wrong project.

In Supabase SQL Editor, run BOTH files in order:
1. `supabase/schema.sql` — creates the tables
2. `supabase/seed.sql` — inserts your project, users, categories, spaces, vendors

After seed runs, refresh the deployed app — the "Who are you?" screen should list 5 users.

If "Who are you?" still shows nothing:
- Open the deployed URL in browser
- Open DevTools (F12) → Network tab
- Look for the `users` request → check the response. If you see `[]`, seed didn't run. If you see a 401/403, the anon key in `.env` doesn't match Supabase project.

## Files changed in this update
- `src/components/contacts/ContactPicker.jsx` — NEW
- `src/pages/Notes.jsx` — NEW
- `src/pages/Config.jsx` — rewrote with Add buttons + role groups
- `src/pages/VendorDetail.jsx` — added contact picker to vendor form
- `src/components/ui/BottomNav.jsx` — added Notes tab
- `src/App.jsx` — added /notes route
- `src/pages/WhatsAppSend.jsx` — fixed broken arrow function from previous patch
