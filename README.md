# Teniszpálya EON

Internal tennis court booking site for **Energia Szabadidősport Klub** (Nagykanizsa) — marketing pages plus authenticated booking and account management.

## Tech stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict)
- **UI:** Tailwind CSS 4, shadcn/ui, Lucide icons
- **Database & Auth:** Supabase (`@supabase/ssr`, PostgreSQL, RLS)
- **Email:** Resend (contact form)
- **Validation:** Zod
- **Dates:** date-fns / `@date-fns/tz` (booking slots in local time; DB stores `timestamptz` UTC)

## Features (current)

- Marketing site: landing, gallery, prices, contact
- Auth: register, login, logout; profiles in `public.profiles` (`ON DELETE CASCADE` from `auth.users`)
- Profile (`/profil`): update full name & phone, change password, delete account (Admin API → Auth users)
- Header account menu: avatar dropdown → Profil / Kijelentkezés
- Booking wizard (courts, day, time slots) with season-pass gating via RLS / profile flags
- Contact form emails via Resend

## Routes

| Path | Notes |
| ---- | ----- |
| `/` | Landing |
| `/gallery` | Gallery |
| `/prices` | Prices |
| `/booking` | Court booking |
| `/contact` | Contact + form |
| `/login` | Sign in |
| `/register` | Sign up |
| `/register/success` | Post-registration |
| `/profil` | Account settings (auth required) |

Marketing chrome (header, auth toast) lives under `src/app/(marketing)/`.

## Project structure

```
src/
├── app/
│   ├── (marketing)/     # Public + auth pages (layout with SiteHeader)
│   ├── layout.tsx       # Root layout
│   └── globals.css
├── actions/             # Server Actions
│   ├── auth.ts          # register, login, logout
│   ├── profile.ts       # updateProfile, updatePassword, deleteAccount
│   ├── booking.ts       # courts, availability, createBooking
│   └── contact.ts       # sendContactMessage
├── components/
│   ├── ui/              # shadcn/ui primitives
│   └── feature/         # Domain UI (landing, booking, auth, profile, chrome, …)
├── content/             # Hungarian copy / page content
├── lib/
│   ├── supabase/        # browser, server, admin (service role), proxy session
│   ├── booking/         # slot helpers / constants
│   ├── env.ts           # env parsing
│   └── utils.ts         # cn(), etc.
├── proxy.ts             # Session refresh proxy
└── types/
    └── database.types.ts

supabase/
├── migrations/          # Versioned SQL (profiles, booking, RLS)
├── seed.sql
└── config.toml
```

### Auth & data notes

- User profiles: `public.profiles` (`full_name`, `phone`, `role`, `active_season_pass`)
- RLS: users can `SELECT` / `UPDATE` their own profile; booking insert requires an active season pass
- Account deletion: `SUPABASE_SERVICE_ROLE_KEY` + `auth.admin.deleteUser` (never expose service role to the client)
- Session refresh: `src/proxy.ts` + `src/lib/supabase/proxy.ts` (Next.js proxy convention)

## Environment

See `.env.example`:

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; account deletion |
| `RESEND_API_KEY` | Contact emails |
| `CONTACT_TO_EMAIL` / `CONTACT_FROM_EMAIL` | Contact recipients / sender |

After schema changes, regenerate types against the linked project:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```
