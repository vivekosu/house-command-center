# Testing Checklist

## 1. Open app
[ ] Visit your Vercel URL
[ ] Who are you? screen appears
[ ] Tap Owner → Today screen loads
[ ] Close and reopen → remembers you (no re-selection)

## 2. Add vendor
[ ] Vendors → + Add
[ ] Name, phone, category, language → Save
[ ] Appears in list

## 3. Add task
[ ] Tasks → + Add
[ ] Set end date to yesterday
[ ] Today screen → task appears in overdue section

## 4. Log a promise
[ ] Today → + Promise on overdue task
[ ] Vendor, type, workers, date → Save
[ ] Promises tab → shows as Pending
[ ] Mark missed → vendor missed count increases

## 5. WhatsApp message
[ ] Today → WhatsApp button
[ ] Select vendor, task, template
[ ] Bilingual preview appears (English + Hindi)
[ ] Open WhatsApp & Send → WhatsApp opens with message

## 6. Vendor portal (open in incognito!)
[ ] Config → Vendors → copy vendor link
[ ] Open link in incognito window
[ ] Only that vendor's tasks visible
[ ] Can update status and upload photo

## 7. Photo upload
[ ] Photos → + Add
[ ] Select photo → Upload
[ ] Appears in photo grid

## 8. Clarification
[ ] Clarifications → + Add
[ ] Question + assign to architect
[ ] Appears as open
[ ] Tap resolve → enters answered state

## 9. Weekly plan
[ ] Plan tab → tasks for the week visible
[ ] Check vendor checkbox → Send button appears
[ ] Tap Send → WhatsApp opens with weekly plan

## Common fixes
Blank screen       → check .env Supabase keys
No users shown     → re-run seed.sql in Supabase
Photos fail        → check site-photos bucket is public
Vendor link fails  → run: select name, access_token from vendors;
Voice not working  → use Chrome (Android) or Safari (iPhone)
