# CILRMNG Membership Registry — Go-Live Guide (Option A: Vercel + Neon)

You chose **Option A** — free hosting with a permanent link. Total time:
about **15 minutes**. No credit card needed.

---

## OPTION A — Permanent online hosting (Vercel + Neon, free)

### Step 1 — Create the database (Neon, ~3 min)
1. Go to **https://neon.tech** → Sign up (Google/GitHub works).
2. Click **Create project** → name it `cilrm-registry` → region: closest to
   Nigeria is `AWS eu-west` (Ireland/London).
3. On the project page, copy the **Connection string** — it looks like:
   `postgresql://user:password@ep-xxxx.eu-west-2.aws.neon.tech/neondb?sslmode=require`

### Step 2 — Put the code on GitHub (~3 min)
1. Go to **https://github.com/new** → name: `cilrm-registry` → **Private** → Create.
2. On your computer, unzip this package, then inside the folder:
   ```bash
   git init
   git add .
   git commit -m "CILRMNG membership registry"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/cilrm-registry.git
   git push -u origin main
   ```

### Step 3 — Deploy on Vercel (~5 min)
1. Go to **https://vercel.com** → Sign up with the same GitHub account.
2. **Add New → Project** → Import `cilrm-registry`.
3. Before clicking Deploy, open **Environment Variables** and add:
   - Name: `DATABASE_URL`
   - Value: the Neon connection string from Step 1
4. Click **Deploy**. Vercel builds the app (~2 min) and gives you a
   permanent URL like `https://cilrm-registry.vercel.app`.

### Step 4 — Create the tables (~2 min, one time)
On your computer, inside the project folder:
```bash
echo 'DATABASE_URL=YOUR_NEON_CONNECTION_STRING' > .env
npm install
npm run db:push        # creates all tables in Neon
npm run db:seed        # optional: loads the 29 sample rows
```

### Step 5 — Claim the registry
Open `https://cilrm-registry.vercel.app/setup` and complete the one-time
**root admin sign-up**. Then upload your real register (Excel/CSV) at
Sync / Upload.

### Step 6 — (Optional) your own domain
Vercel project → **Settings → Domains** → add `registry.cilrmng.org`.
Add the CNAME record it shows to your cilrmng.org DNS. Done — your links
are now permanent forever:
- Guest portal → `https://registry.cilrmng.org/guest`
- Admin sign-in → `https://registry.cilrmng.org/login`

### After go-live
- The URL **never changes** — print it, share it, bookmark it.
- Data lives in Neon with daily automatic backups (plus the app's own vault
  snapshots → download CSV/JSON to a flash drive periodically).
- Updates: push to GitHub → Vercel redeploys automatically.

---

## OPTION B — Run on an office computer (offline-first)

Requirements: Node.js 20+ and PostgreSQL 14+.

```bash
npm install
cp .env.example .env      # edit DATABASE_URL for your local Postgres
npm run db:push
npm run db:seed           # optional sample data
npm run build
npm start                 # app at http://localhost:3000
```
Other computers on the office network use `http://<host-ip>:3000`.

---

## Moving data between installations
- **Export:** Vault & backups → download snapshot (CSV/JSON).
- **Import:** Sync / Upload → upload the CSV. Duplicates are ignored
  automatically (name, registration number, phone, e-mail).

## Reset / recovery notes
- Root admin is permanent; sign-up at `/setup` happens only once per database.
- Forgot password → `/recover` with the recovery code shown at sign-up.
