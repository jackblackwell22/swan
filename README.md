# Swan Street Lock-Ups

A small website for the lock-up garages on Swan Street, Royal Leamington Spa, plus a private owners’ desk for tenants, invoices and rent.

You do **not** need Stripe, GoCardless, or a paid email company. The site uses a file on the computer (SQLite) and, when you are ready, the ordinary mailbox that comes with your domain.

This guide is written for the two of you, not for a developer.

---

## What the public site does

- **Home, The garages, Location, Enquire, For tenants, Privacy**
- The photograph on the site is of the lock-ups (blue wooden doors and brick). The file is `public/images/lock-ups.jpg` — replace it with your own original if you prefer, keeping the same name.
- The map is OpenStreetMap of Swan Street. It pins the street, not a made-up unit number.
- The enquiry form stores messages for you. If email is set up, a copy also goes to your mailbox.
- Empty contact fields stay hidden. Do not invent a phone number, email or price to “fill the gap” — leave those lines blank until they are real.

The owners’ desk is at `/admin` (a very small “Owners” link sits at the foot of the public site). It is not in the main menu.

---

## Run it on this computer (to try it)

You need [Node.js](https://nodejs.org) 20 or newer (the LTS version is fine).

1. Copy the project onto the computer.
2. Open a terminal in this folder.
3. Copy the example settings:

   **On a Mac or Linux**

   ```bash
   cp .env.example .env.local
   ```

   **On Windows (Command Prompt)**

   ```bat
   copy .env.example .env.local
   ```

4. Open `.env.local` in Notepad (or TextEdit) and change the two owner emails and passwords. Leave phone, email and bank lines blank if you do not want them on the website yet.
5. Install and start:

   ```bash
   npm install
   npm run dev
   ```

6. In a browser open [http://127.0.0.1:43141](http://127.0.0.1:43141).

The first time you sign in at `/admin/login`, you will be asked to scan a QR code with an authenticator app (Google Authenticator, Authy, or the one built into many phones). After that, sign-in is email, password, then a six-digit code.

If you set `ADMIN1_TOTP_SECRET` in `.env.local`, two-factor is already on for that owner and you will not see the QR screen.

---

## What to fill in (`.env.local`)

Anything left blank is **hidden**. That is deliberate.

| Setting | What it is |
| --- | --- |
| `BUSINESS_NAME` | Usually “Swan Street Lock-Ups” |
| `BUSINESS_ADDRESS` | Correspondence address for invoices. Leave blank if you do not want it printed yet. |
| `BUSINESS_EMAIL` | Your real mailbox, once you have one |
| `BUSINESS_PHONE` | Your real telephone, or blank |
| `VAT_REGISTERED` | `true` only if you are VAT registered |
| `VAT_NUMBER` | Only if you want it on invoices |
| `BANK_SORT_CODE` / `BANK_ACCOUNT_NUMBER` | Printed on invoices **only if both are set** |
| `ADMIN1_EMAIL` / `ADMIN1_PASSWORD` | Father |
| `ADMIN2_EMAIL` / `ADMIN2_PASSWORD` | Son |
| `SESSION_SECRET` | A long random sentence, at least 32 characters. Do not share it. |
| `CRON_SECRET` | Another long random string, used if your host runs the monthly job by web address |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` | Your domain mailbox. Leave blank until it exists — PDFs still work. |
| `SITE_URL` | `http://127.0.0.1:43141` while testing; later `https://your-domain` |

There is no company number, VAT number or bank account invented for you. Add those only when they are real.

---

## How the owners’ desk works

Sign in at `/admin`.

1. **Tenants** — add each person or business: name, email, the label you use for the unit (1, 2, 3 or whatever you write), monthly rent in pounds, business or private, active or ended.
2. **This month** — “Create this month’s invoices” makes a numbered PDF for every **active** tenant. You can also invoice one tenant from their page.
3. **Invoices** — download the PDF, email it (if SMTP is filled in), resend, or mark paid. If email is not set up, a yellow note says so; you can still download the PDF.
4. **Payments** — one click marks an invoice paid. Or upload a CSV from online banking. The site looks for the payment reference first (`SWAN-4-SEP26`). Amount and date alone are only a **suggestion** you confirm. If two tenants pay the same rent, it will not guess.

On a development computer the site includes a few tenants clearly named **EXAMPLE** / **sample data**. They are not real and are not created when the site runs in production.

### Payment references

Every invoice has a unique reference:

`SWAN-{unit}-{MON}{YY}`

Example: unit 4, September 2026 → `SWAN-4-SEP26`.

Ask tenants to put that on the bank transfer in full. That is how matching works without paying a bank API.

---

## Email (the free mailbox that comes with your domain)

When you buy a domain, the host almost always includes a mailbox. In `.env.local` (or the host’s “environment variables” screen) set:

- `SMTP_HOST` — your host will tell you, often something like `mail.yourdomain.co.uk`
- `SMTP_PORT` — usually `587` (or `465` with `SMTP_SECURE=true`)
- `SMTP_USER` / `SMTP_PASS` — the mailbox login
- `FROM_EMAIL` — the same address, or a “from” address the host allows

Until those are filled, invoices are still generated. They are just not emailed automatically.

---

## The monthly job (1st of the month, UK time)

On the 1st of the month at 08:05 Europe/London the running website creates invoices for active tenants and emails them if SMTP is set.

Unpaid invoices get a reminder after 7 days and 14 days (09:10 each morning, if SMTP is set).

If the computer is not running overnight, you can:

- Click **Create this month’s invoices** on the owners’ desk, or
- On the computer, in this folder:

  ```bash
  npm run job:monthly
  npm run job:reminders
  ```

- Or ask the host to call these addresses once a month / once a day (replace the secret):

  `https://your-domain/api/jobs/monthly?secret=YOUR_CRON_SECRET`  
  `https://your-domain/api/jobs/reminders?secret=YOUR_CRON_SECRET`

On a small always-on box (a cheap VPS, or a home computer that stays on), a crontab is enough:

```
5 8 1 * * cd /path/to/this/folder && /usr/bin/npm run job:monthly
10 9 * * * cd /path/to/this/folder && /usr/bin/npm run job:reminders
```

---

## Going live (domain and hosting)

You only need:

1. A domain name (for example `swanstreetlockups.co.uk` — choose what you actually buy).
2. Hosting that can run a Node.js app and keep a small file on disk (the database). A modest VPS is enough. Shared “static only” hosting will not run this.

Typical steps on a small Linux server:

```bash
npm install
cp .env.example .env.local
# edit .env.local — real emails, passwords, SESSION_SECRET, SITE_URL=https://your-domain
npm run build
npm start
```

Put **Nginx** or **Caddy** in front so the public address is HTTPS (your host often does this for you). Point the domain’s DNS A record at the server.

Set `SITE_URL` to `https://your-domain` (no trailing slash).

Keep a copy of the `data` folder somewhere safe. That folder is the tenants, invoices and enquiries. If the computer dies and you have no copy, that information is gone.

---

## Bank statement CSV

Most UK banks let you download transactions as CSV. A simple file looks like the example in `examples/sample-bank-statement.csv`:

```text
Date,Description,Amount
01/08/2026,BACS SWAN-EX1-AUG26 RIVERSIDE,175.00
```

Columns named Date, Description and Amount (or “Paid in” / “Money in”) are understood. Only money **in** is read. We do not store anyone’s account number from the file.

---

## Security (short version)

- Passwords are stored as hashes, not as the password itself.
- The owners’ cookie is httpOnly. On a live HTTPS site it is also marked secure.
- Login attempts are limited so a stranger cannot try passwords all day.
- Tenant bank details are not stored.
- Secrets belong in `.env.local` (or the host’s secret settings), not in the public pages.

---

## Commands at a glance

| Command | What it does |
| --- | --- |
| `npm install` | Downloads the software (once) |
| `npm run dev` | Trial copy on this computer, port 43141 |
| `npm run build` | Prepares the live copy |
| `npm start` | Runs the live copy |
| `npm run job:monthly` | Create this month’s invoices now |
| `npm run job:reminders` | Send 7- and 14-day reminders now |

The code lives in this project folder. You do not need GitHub to run it.
