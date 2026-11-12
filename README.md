# Kolé

Kolé sells houses and land from developers in Lagos (Ikoyi, Victoria Island, Banana Island, Lekki axis) and luxury Abuja (Maitama, Asokoro, Guzape). Kolé is the go-between: **developers have no login**, and **buyers sign up and get a dashboard**. Built with Next.js 14.

## Run it

```
npm install
npm run dev        # http://localhost:3000
```

For production: `npm run build` then `npm start`.

## Who can do what

- **Buyers** sign up at `/register` (free) and log in at `/login`. Their dashboard (`/dashboard`) shows their saved shortlist, their chats with the Kolé team, and their details and password.
- **The Kolé team (admin)** logs in with `admin@kole.local` / `ChangeMe123!` (change both in `.env.local` before going live). The team dashboard at `/admin` is where you add and edit properties, add the developers you work with, answer buyer chats, see all buyers and what they saved, and handle partner requests.
- **Developers** never log in. They open `/partner` and send a request. You add them under Admin > Developers, then pick them when you add a property. Their phone and email stay private to the team.

## What is in it

- **3D view** on every listing with two or more photos, plus an optional **360° tour** when you upload a 2:1 panorama.
- **Search on the landing page** (live match count, suggestions, Buy / Rent / Land tabs), **Top buildings** (most expensive houses for sale) and **Top lands** (most expensive plots, with price per sqm). Both re-rank by themselves.
- **A page for every nav link**: `/buildings`, `/lands`, `/top-buildings`, `/top-lands`, `/areas` (and `/areas/ikoyi` etc.), `/developers` and `/developers/<id>`, plus `/search`, `/saved`, `/about`, `/guide` and `/partner`.
- **Built for buyers abroad**: each listing shows which title documents the developer can show, build stage, handover month, payment plan and when it was last updated. The admin can tick "Documents checked" on a listing and "Verified" on a developer. Buyers chat with Kolé (ready questions for a live video tour, document copies and escrow) and can say where they live so the team can plan a call. `/guide` has the 5 checks before paying.
- **Developer types**: Luxury residential, Estate and land, Affordable and mortgage-ready, Commercial and mixed-use, Joint-venture, Individual and small. The Developers page filters by kind.

## Notes

- **Storage.** With `DATABASE_URL` set, everything (listings, accounts, chats and uploaded photos) lives in Postgres. Without it the site uses `data/db.json` on your own computer. On Vercel without a database it still opens, but shows a warning in the admin area because Vercel's disk is wiped.

## Deploy on Vercel

The "Application error ... Digest" page on Vercel came from the site trying to write files to Vercel's read-only disk. Fix:

1. In Vercel open your project, then Storage, then create or connect a Neon (Postgres) database. This adds `DATABASE_URL` for you.
2. In Settings, then Environment Variables, add `ADMIN_EMAIL` and `ADMIN_PASSWORD` (your admin login).
3. Redeploy. The tables and sample listings are created on the first visit.

Photos are shrunk in the browser before upload to stay under Vercel's 4.5 MB request limit.

## Teams

Admin, then Teams: create teams (for example "Ikoyi Desk", "Abuja Desk"), list the areas each covers, and add members with their own logins. A new enquiry goes to the team covering the property's area (otherwise the least busy team). Buyers see the team name on the chat, on each reply and under "Teams attending to you" on their dashboard. Team members see only their own team's chats; the admin sees all and can move a chat to another team from the conversation.
- 18 sample listings and 4 sample developers are included, marked "Sample". Remove them in the team dashboard with "Remove sample data".
- Sample photos are Unsplash stand-ins. Replace them with real ones.
- The site takes no payments. The "checked" ticks only mean something if the team has really seen the documents.
- Fonts load from Google Fonts, so the first build needs internet.
