# Kolé

Kolé sells houses and land from developers in Lagos (Ikoyi, Victoria Island, Banana Island, Lekki axis) and luxury Abuja (Maitama, Asokoro, Guzape). Kolé is the go-between: **developers have no login**, and **buyers sign up and get a dashboard**. Built with Next.js 14.

## Run it

```
npm install
npm run dev        # http://localhost:3000
```

For local environment variables, copy `.env.example` to `.env.local` in the project root and fill in the values you use. Restart `npm run dev` after changing `.env.local`; the server reads several settings, including database configuration, when it starts. `.env.local` is ignored by Git and is not deployed to Vercel. For Vercel, set variables in the project's **Settings > Environment Variables**, then redeploy.

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

- **Storage.** The database is Supabase Postgres (set `DATABASE_URL`). Everything (listings, accounts, chats, contact messages) lives there. Photos, 360 photos and videos live in Supabase Storage (set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`). Without them the site falls back to `data/` on your own computer. On Vercel without a database it still opens, but shows a warning in the admin area because Vercel's disk is wiped.

## Set up Supabase (5 minutes)

1. Create a project at supabase.com.
2. Project Settings, then Database, then Connection string, then **Transaction pooler**. Copy it into `DATABASE_URL` (put your database password in).
3. Project Settings, then API: copy the Project URL into `SUPABASE_URL` and the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`. This key is a secret: keep it only in `.env` or Vercel, never in the mobile apps.
4. Start the site. The tables are created on the first visit, row level security is switched on for them, and the public `kole-media` bucket is created for you. (`supabase/schema.sql` is there if you prefer to run the SQL yourself.)
5. Videos upload straight from the browser to Supabase Storage, so Vercel's 4.5 MB limit does not apply. Supabase's free plan allows 50 MB per file; set `KOLE_MAX_VIDEO_MB` to match your plan (and raise the limit in Supabase, Storage, Settings).

Tip for clear videos: export from your phone or editor as MP4 (H.264), 1080p, landscape, around 8 to 12 Mbit/s. That stays sharp and fits 50 MB for about 40 seconds. For a longer tour, upload two or three clips.

## Email (SMTP)

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` and `CONTACT_TO` (see `.env.example`). Messages from the Contact page (website and app) are always saved in Admin, then Contact, and are also emailed to `CONTACT_TO`; the sender gets a short receipt. With no `SMTP_HOST` the site still works and just skips the email. Contact details on the page come from `CONTACT_EMAIL`, `CONTACT_PHONE`, `CONTACT_WHATSAPP` and `CONTACT_ADDRESS`.

## Deploy on Vercel

The "Application error ... Digest" page on Vercel came from the site trying to write files to Vercel's read-only disk. Fix:

1. Do the Supabase steps above.
2. In Vercel, Settings, then Environment Variables, add everything from `.env.example` that you use (at least `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and the SMTP ones).
3. Redeploy. The tables and sample listings are created on the first visit.
4. Set `SITE_URL` to your public HTTPS domain to use email-based password resets.

Photos are shrunk in the browser before upload; videos are not touched, so they keep their full quality.

## Sign-up and login

Sign-up asks for name, email, **country** (searchable list with flags, pre-filled from the visitor's browser region), an optional **phone number with a country-code selector** (formatted as you type and checked for the chosen country), and a password with a strength bar and show/hide. Phones are stored in one standard form (for example `+2348012345678`) and the country is saved with its ISO code. The same fields are in the buyer app and in the profile form on the buyer dashboard. The country list is in `lib/countries.ts`, phone checks use `libphonenumber-js`.

Use **Forgot your password?** on the login page to request a reset email. Reset links expire after 30 minutes and can be used once; changing the password signs out other sessions. Password resets are currently for buyer/client accounts and require SMTP settings plus `SITE_URL`.

## 3D, video and 360

Every listing with two or more photos gets the 3D view: large photos in depth, a thumbnail strip, and a full-screen viewer with zoom. Add up to four videos per listing in the property form (a cover image is made for you). A 360 tour opens full screen too.

## Teams

Admin, then Teams: create teams (for example "Ikoyi Desk", "Abuja Desk"), list the areas each covers, and add members with their own logins. A new enquiry goes to the team covering the property's area (otherwise the least busy team). Buyers see the team name on the chat, on each reply and under "Teams attending to you" on their dashboard. Team members see only their own team's chats; the admin sees all and can move a chat to another team from the conversation.
- 18 sample listings and 4 sample developers are included, marked "Sample". Remove them in the team dashboard with "Remove sample data".
- Sample photos are Unsplash stand-ins. Replace them with real ones.
- The site takes no payments. The "checked" ticks only mean something if the team has really seen the documents.
- Fonts load from Google Fonts, so the first build needs internet.


## Mobile app

The React Native buyer app is in the separate `kole-mobile` folder (Expo SDK 58). It uses `/api/properties`, `/api/auth/*` (token login), `/api/saved` and the chat routes of this site. Send `Authorization: Bearer <token>`; the login and sign-up responses include the token.

## Chat: automatic reply, online routing and files

- A new chat gets an automatic "Kolé assistant" message first. If a team has someone online it says so; if nobody is online it says the team will reply when back (set the hours it quotes with `KOLE_HOURS`).
- Before a team member has replied, the assistant responds to each client message using the conversation history and confirmed listing details. It stops auto-answering once a team member replies. When OpenAI is not configured or unavailable, the built-in listing FAQ answers known questions; anything else is passed to the team.
- To enable the AI conversation, set `OPENAI_API_KEY` in your server environment. Optionally set `OPENAI_MODEL` (defaults to `gpt-4o-mini`). Client chat text and relevant listing details are sent to OpenAI when enabled. Keep the key server-side; never add it to client code.
- New chats go to a team that has an agent online right now (a team covering the property's area is preferred). Until a person from the team has replied, a chat sitting with an offline team moves to a team that comes online, and the assistant says so.
- An agent counts as online while the website inbox or the Team app is open (a ping every 25 s; 75 s of silence = offline). Agents can switch Online/Away on the Messages page or in the Team app's Me tab.
- Clients and the team can send photos, PDF, Word, Excel, PowerPoint, TXT and CSV (up to 5 per message, 4 MB each on Vercel). Files are checked by content, stored in the database/uploads folder (not the public bucket) and opened through links that expire after an hour.
- Clients can permanently delete a conversation from their Messages page. This removes its messages from the team/admin history too; attachments no longer referenced by another message are deleted as well.
