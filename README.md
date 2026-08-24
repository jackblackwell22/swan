# Swan Street Lock-Ups

A website for the family lock-up garages on **Swan Street, Royal Leamington Spa**.

Jack Blackwell and David Blackwell let units **7, 8, 9, 10, 11 and 12**. This site is the public pages plus a private “owners’ desk” where you record who rents what and print monthly invoices.

You do **not** need Stripe, GoCardless, or any paid internet service. The only costs you should need are a domain name and a computer (or hosting company) that can run a Node.js website.

---

## What you need on a computer

1. [Node.js](https://nodejs.org/) version 20 or newer (the LTS button on that page is fine).
2. This project folder.

On Windows, Mac, or Linux, open a terminal in this folder and run:

```bash
npm install
```

That only needs doing when you first copy the project, or when someone has added new packages.

---

## The secret settings file

Copy the example file and fill it in. **Never put this filled-in file on GitHub.**

```bash
cp .env.example .env.local
```

Then open `.env.local` in a text editor.

| Name | What it is |
| --- | --- |
| `JACK_USERNAME` / `JACK_PASSWORD` | Jack’s login for the owners’ desk |
| `DAVID_USERNAME` / `DAVID_PASSWORD` | David’s login |
| `SESSION_SECRET` | A long random string (any 32+ characters) so the site can keep you signed in |
| `CRON_SECRET` | A different long random string. Needed for the monthly invoice web address |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Optional. Your mailbox’s outgoing mail connection, if you want invoices emailed. Leave blank to still make PDFs without sending mail. Each landlord’s From address is typed on the Garages page, not here. |
| `DATABASE_PATH` | Optional. Full path to the database file. If blank, the site uses `data/swan.sqlite` |

Pick your own usernames and strong passwords. Do not reuse a banking password.

On your own computer, if those owner logins are set, the login page also shows **Open the owners’ desk** — a one-click sign-in for convenience. That button is **not** shown on the live internet site.

---

## Run it on your own computer

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in a browser.

The owners’ desk is [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

Stop it with `Ctrl+C` in the terminal.

To check the public site will build (the same check a host should run):

```bash
npm run build
```

---

## First jobs in the owners’ desk

1. **Garages** — for each of units 7–12, choose Jack, David, or Not set. Do not guess; leave “Not set” until you know.
2. On the same page, fill **postal address**, **BACS**, and **from-email** for each landlord if you want them used. Empty boxes stay empty on the PDF, and invoices are not emailed for a landlord until that landlord has a from-email. **Accepting enquiries** is on the same page.
3. **Tenants** — add a person, tick the lock-ups they rent, and type the monthly rent for each. One lock-up cannot be let to two people at once.
4. **This month** — when you are ready, **Create this month’s invoices**. You also get a PDF download later under **Invoices**. If outgoing email is not set, the page will say so; PDFs are still made.

**Accepting enquiries** (on This month and on Garages) is on by default. Switch it off when everything is let: the public form disappears, Enquire links hide, and the site says the lock-ups are all let.

There is no “mark as paid”, no unpaid list, and no reminder emails. Payment is ordinary bank transfer using the reference on the PDF.

---

## Monthly invoices (the 1st of the month)

Invoices are grouped like this:

- One invoice per tenant per landlord per month.
- Two of Jack’s units → one Jack PDF with two lines.
- One Jack unit and one David unit → two invoices.

The payment reference looks like `SWAN-J-7-8-SEP26` (landlord initial, unit numbers, month and year).

Two ways they get created:

1. **If this website’s Node process stays running**, it will try at **08:05 UK time on the 1st** of each month (using `node-cron`).
2. **A web address** any cheap “cron” service can call, even if the host only wakes up on request:

   `GET` or `POST` `/api/jobs/monthly`

   Protect it with `CRON_SECRET`. Any one of these works:

   - Header `Authorization: Bearer YOUR_CRON_SECRET`
   - Header `x-cron-secret: YOUR_CRON_SECRET`
   - Query string `?secret=YOUR_CRON_SECRET` (easier for some free ping services; treat the secret like a password)

If email (SMTP) is not set, PDFs are still saved and you can download them. The owners’ desk will say email is not configured.

---

## Point a domain at the site

Buy a domain (for example from your usual registrar). On their DNS screen:

- If your host gives you an **IP address**, create an **A** record for `@` (and usually `www`) pointing at that IP.
- If your host gives you a **hostname** (like `something.example.com`), create a **CNAME** for `www` (and follow their notes for the root `@` record).

Ask the host to add your domain to the site and to issue a free HTTPS certificate (Let’s Encrypt is common). After DNS has updated (sometimes a few hours), `https://your-domain` should open this website.

---

## Put it on the internet (not GitHub Pages)

GitHub Pages can only show static files. This site needs **Node.js** and a **writable disk** for the SQLite database (`data/swan.sqlite`) and the PDF folder (`data/invoices/`). Use a small Node host or a Linux computer that stays on, for example:

- A cheap virtual server (Hetzner, DigitalOcean, Linode, and similar)
- A Node “web service” with a **persistent disk** (some platforms call this a volume)

Typical commands on the server, after copying the project and setting the same environment names as `.env.example`:

```bash
npm install
npm run build
npm run start
```

`npm run start` serves the built site. Put a reverse proxy (Caddy or Nginx) in front if you want HTTPS on port 443.

Keep the `data` folder on the persistent disk and back it up. That folder holds tenants, enquiries, and invoices. It is not part of GitHub.

Set the environment variables in the host’s dashboard (or a `.env` file that is **not** committed). Restart after changing them.

If the host **sleeps** when nobody visits, do not rely on the built-in 08:05 timer. Use a free monthly ping to `/api/jobs/monthly` with your `CRON_SECRET`.

---

## What is deliberately not here

- No card payments, Open Banking, or paid email APIs
- No CCTV claims, prices, phone numbers, or company numbers on the public pages (those were not supplied)
- Passwords, the database, PDFs, and `.env.local` stay off GitHub

If you have a better photograph of the lock-ups, replace `public/images/swan-street-lock-ups.png` and keep the same file name.
