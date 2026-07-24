# Teniszpálya EON

Production-ready tennis court booking system built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS, shadcn/ui
- **Database & Auth:** Supabase (PostgreSQL, RLS)
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase CLI (optional, for local database workflows)

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Supabase project URL and keys in `.env.local`.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Supabase

The project is linked to a remote Supabase project via the CLI (`supabase/.temp/linked-project.json`). Migrations live in `supabase/migrations/`. Regenerate TypeScript types after schema changes:

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

## Project Structure

```
src/
├── app/              # Next.js pages, layouts, route handlers
├── actions/          # Server Actions (mutations)
├── components/
│   ├── ui/           # shadcn/ui components
│   └── feature/      # Domain-specific components
├── lib/              # Supabase clients, env, utilities
└── types/            # TypeScript types (incl. database.types.ts)
supabase/
├── migrations/       # SQL migration scripts
└── seed.sql          # Local seed data
```

## Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Production build         |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |
