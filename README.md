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

Owners’ desk: [http://127.0.0.1:43141/admin/login](http://127.0.0.1:43141/admin/login)

On this trial copy, sign in with email and password only (no authenticator app):

- `dad@example.com` / `change-me-dad`
- `son@example.com` / `change-me-son`

Two-factor is off until you choose to turn it on by setting `ADMIN1_TOTP_SECRET` or `ADMIN2_TOTP_SECRET` in `.env.local`.

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
| `JACK_FROM_EMAIL` / `DAVID_FROM_EMAIL` | From address on that landlord’s invoices. Leave blank until real — PDFs still generate. |
| `JACK_BANK_SORT_CODE` / `JACK_BANK_ACCOUNT_NUMBER` | Jack’s BACS details, printed only when both are set |
| `DAVID_BANK_SORT_CODE` / `DAVID_BANK_ACCOUNT_NUMBER` | David’s BACS details, printed only when both are set |
| `ADMIN1_EMAIL` / `ADMIN1_PASSWORD` | First owner. Trial: `dad@example.com` / `change-me-dad` |
| `ADMIN2_EMAIL` / `ADMIN2_PASSWORD` | Second owner. Trial: `son@example.com` / `change-me-son` |
| `SESSION_SECRET` | A long random sentence, at least 32 characters. Do not share it. |
| `CRON_SECRET` | Another long random string, used if your host runs the monthly job by web address |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Shared mailbox for sending. Leave blank until it exists. |
| `FROM_EMAIL` | From address for website enquiries only |
| `SITE_URL` | `http://127.0.0.1:43141` while testing; later `https://your-domain` |

There is no company number, VAT number or bank account invented for you. Add those only when they are real.

---

## How the owners’ desk works

Sign in at `/admin`.

1. **Garages** — the six lock-ups are numbered **7, 8, 9, 10, 11, 12**. For each one, choose Jack Blackwell or David Blackwell. Leave it unset until you know; the desk will not guess.
2. **Tenants** — name, email, which of 7–12 they rent (one or more), rent **per garage**, business or private, active or ended. A garage can only be let to one active tenant at a time.
3. **This month** — “Create this month’s invoices” makes PDFs for every **active** tenant. One invoice per tenant per landlord per month: two of Jack’s units is one Jack invoice with two line items; one of Jack’s and one of David’s is two invoices. You can also invoice one tenant from their page.
4. **Invoices** — download the PDF, email it (if that landlord’s from-email and SMTP are filled in), resend, or mark paid. If a landlord’s email is not set, the PDF still generates and the desk says email is not set up for them.
5. **Payments** — one click marks an invoice paid. Or upload a CSV from online banking. The site looks for the payment reference first (`SWAN-J-7-8-SEP26`). Amount and date alone are only a **suggestion** you confirm. If two tenants pay the same rent, it will not guess.

Both of you use the same owners’ desk. Jack and David are the two landlords, not two separate apps.

On a development computer the site includes a few tenants clearly named **EXAMPLE** / **sample data**. They are not real and are not created when the site runs in production.

### Payment references

Every invoice has a unique reference so BACS matching works:

`SWAN-{J or D}-{garage numbers}-{MON}{YY}`

- **J** is Jack Blackwell, **D** is David Blackwell.
- Garage numbers on that invoice are listed in order, hyphen-separated.

Examples:

- Jack, garages 7 and 8, September 2026 → `SWAN-J-7-8-SEP26`
- David, garage 10, September 2026 → `SWAN-D-10-SEP26`

Ask tenants to put that on the bank transfer in full. CSV matching still uses this reference first. That is how matching works without paying a bank API.

---

## Email (the free mailbox that comes with your domain)

When you buy a domain, the host almost always includes a mailbox. In `.env.local` (or the host’s “environment variables” screen) set:

- `SMTP_HOST` — your host will tell you, often something like `mail.yourdomain.co.uk`
- `SMTP_PORT` — usually `587` (or `465` with `SMTP_SECURE=true`)
- `SMTP_USER` / `SMTP_PASS` — the mailbox login
- `JACK_FROM_EMAIL` / `DAVID_FROM_EMAIL` — the From address on that landlord’s invoices (the shared SMTP host still sends them)
- `FROM_EMAIL` — From address for website enquiry notifications

Until SMTP is filled, invoices are still generated. They are just not emailed automatically. If SMTP is set but a landlord’s from-email is empty, that landlord’s PDFs still generate and the desk says email is not set up for them.

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
01/08/2026,BACS SWAN-J-7-AUG26 RIVERSIDE,175.00
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
