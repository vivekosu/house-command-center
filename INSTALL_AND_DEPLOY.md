# House Command Center — Install & Deploy Guide

## 📦 What's in this version (v3 — final)

| Feature | Status |
|---|---|
| Today screen with overdue/due-today | ✅ |
| Tasks list (filter active / all / done) | ✅ |
| Add task — typed | ✅ |
| **Add task — voice (auto-fills floor, category, priority)** | ✅ NEW |
| Task detail with notes, photos, status | ✅ |
| **Log promise on a task (+ button)** | ✅ NEW |
| **Escalation level badge on vendor** | ✅ NEW |
| Vendors list + edit | ✅ |
| **Pick vendor / team from phone contacts** | ✅ NEW |
| Promises list (filter pending / kept / missed) | ✅ |
| Mark promise kept / missed / partial | ✅ |
| WhatsApp send (3-step: vendor → task → template) | ✅ |
| Bilingual messages (English / Hindi / Both) | ✅ |
| **Built-in templates** (reminder, escalation, payment hold, etc.) | ✅ |
| **Custom templates — add your own with Hindi + English** | ✅ NEW |
| Weekly Plan — send vendors their week's tasks | ✅ |
| Photo upload per task + photo gallery | ✅ |
| Clarifications — ask + assign to architect | ✅ |
| **All-notes feed (typed + voice)** | ✅ NEW |
| Vendor portal (token URL — sees only own tasks) | ✅ |
| Team portal (token URL or "Who are you?" picker) | ✅ |
| Config: team grouped by role | ✅ |
| Config: + Add team member from contacts | ✅ NEW |
| Config: + Add vendor from contacts | ✅ NEW |
| Config: links to all subpages | ✅ |
| Multi-vendor on a task | ✅ |
| PWA — installable on phone | ✅ |

---

## 🛠 Step 1 — Replace files on your PC

You already have the project at:
```
C:\Users\VivekGoel\Desktop\house-command-center
```

1. Unzip the new file (`house-command-center-v3.zip`) to your Desktop.
2. The unzipped folder is named `app_fixed` — copy **everything inside** it.
3. Paste **into** `C:\Users\VivekGoel\Desktop\house-command-center`, choose **Replace all** when Windows asks.
4. Your `node_modules` folder stays untouched — only source code is replaced.

---

## 🛠 Step 2 — Test locally before pushing

Open Command Prompt:

```cmd
cd C:\Users\VivekGoel\Desktop\house-command-center
npm run dev
```

Open `http://localhost:5173` — you should see the "Who are you?" screen with 5 names.

**If it shows blank or no names**, the seed data hasn't been loaded into Supabase. See "Step 3 — Seed your database" below.

---

## 🛠 Step 3 — Seed your database (only if data is empty)

1. Go to https://supabase.com/dashboard → your project → SQL Editor
2. Open `supabase/schema.sql` from the project, paste into SQL Editor, click **Run**
3. Open `supabase/seed.sql`, paste into SQL Editor, click **Run**
4. Refresh the app — 5 users should appear

⚠️ If you already ran schema.sql before, running it again will fail (tables exist). That's fine — only run seed.sql.

---

## 🛠 Step 4 — Push to GitHub (so Vishal can deploy)

### If you've never used GitHub before:

**A. Install GitHub Desktop** (easiest path — no command line)
1. Download from https://desktop.github.com → install → sign in with your GitHub account
2. Click **File → Add local repository** → browse to `C:\Users\VivekGoel\Desktop\house-command-center`
3. If it says "this isn't a git repository", click **Create a repository** in the message
4. Click **Publish repository** at the top
5. Name it `house-command-center` → choose **Private** if you want only Vishal to see → **Publish**
6. Done. Your code is now on GitHub.
7. Share the repo URL with Vishal — go to your repo on github.com → **Settings → Collaborators** → invite Vishal by his GitHub username or email.

### If you already have it on GitHub:

In the project folder, open Command Prompt:
```cmd
cd C:\Users\VivekGoel\Desktop\house-command-center
git add .
git commit -m "v3: voice tasks, custom templates, contact picker, log promise"
git push
```

---

## 🛠 Step 5 — Vishal deploys to Vercel

Tell Vishal:

> Pull the repo from GitHub. Run `npm install`. Get the `.env` values from Vivek (Supabase URL, anon key, project ID, app URL). On Vercel: **New Project → Import from GitHub → select house-command-center → Add the 4 environment variables → Deploy**. After deploy, copy the production URL and update `VITE_APP_URL` to that URL → redeploy once more.

The 4 environment variables are:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PROJECT_ID`
- `VITE_APP_URL`

These already exist in your local `.env` file. **Do NOT commit `.env` to GitHub** (it's already in `.gitignore`).

---

## ⚠️ Things to know

### Phone contact picker
- Works on **Chrome for Android over HTTPS** (Vercel = HTTPS, so production works)
- **Does NOT work on iPhone Safari** — Apple has not implemented the Web Contact Picker API
- On iPhone you'll see manual "name + phone" fields — type by hand
- Won't work on `localhost` either; needs HTTPS

### Voice
- Works on Chrome for Android and Safari for iPhone
- Listens in Hindi (`hi-IN`) — also picks up English fine
- Voice in Notes screen → free-form note
- Voice in "+ New task" → tries to auto-fill floor + category + priority

### Custom templates require owner role
- Only the **owner** role can add / edit / delete custom templates
- Other team members can use them but not modify

---

## 🆘 Troubleshooting

**"Who are you?" shows nothing**
→ Seed.sql wasn't run. See Step 3.

**Blank white screen**
→ Wrong Supabase URL or key in `.env`. Check the Network tab in browser dev tools.

**Phone book picker doesn't appear**
→ You're on iPhone or `localhost`. Both will show manual entry instead. Deploy to Vercel to test on Android Chrome.

**"Failed to load resource" errors**
→ Run `npm install` again to make sure all packages are installed.

**Voice button does nothing**
→ Browser doesn't support Web Speech API. Use Chrome on Android or Safari on iPhone. Won't work on Firefox/desktop Edge.

---

## 📞 What to send Vishal

1. The GitHub repo URL
2. The 4 environment variables (send via private channel, not in repo)
3. A note: "Deploy to Vercel, point `VITE_APP_URL` to the production URL after first deploy"

That's it. He should be able to take it from there.
