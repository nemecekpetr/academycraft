# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AcademyCraft is a gamified learning platform built for children (target audience ~10 years old) preparing for Czech entrance exams (CERMAT). The app uses a Minecraft-inspired theme with XP, levels, emeralds (currency), streaks, and mystery boxes to motivate studying.

## Development Commands

All commands run from the `app/` directory:

```bash
cd app

# Development
npm run dev           # Start dev server at localhost:3000
npm run dev:ssl       # Dev server with SSL proxy (port 3001)

# Build & Production
npm run build         # Build for production
npm run start         # Start production server

# Linting
npm run lint          # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Auth & Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4 + CSS custom properties for theming
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Validation**: Zod
- **Email**: Resend
- **Language**: TypeScript (strict mode)

## Architecture

### Directory Structure

```
app/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Public auth routes (login, register, etc.)
│   ├── (protected)/        # Authenticated user routes
│   ├── admin/              # Admin panel (role-based access)
│   └── api/                # API routes
├── components/
│   ├── game/               # Gamification UI (XpBar, EmeraldCounter, etc.)
│   └── layout/             # Navigation components
├── contexts/
│   └── ThemeContext.tsx    # Global theme state
├── lib/
│   ├── supabase/           # Supabase client initialization
│   │   ├── client.ts       # Browser client (use in 'use client' components)
│   │   ├── server.ts       # Server client (use in Server Components/API routes)
│   │   └── admin.ts        # Admin client with service role key + role verification helpers
│   ├── constants.ts        # Game config, mystery box tiers, encouragement messages
│   ├── levels.ts           # Level progression (getLevelFromXp, getXpToNextLevel, etc.)
│   └── themes.ts           # Theme definitions + buildThemeLevels() helper
├── types/
│   └── database.ts         # Supabase table type definitions
└── middleware.ts           # Auth middleware for route protection
```

### Authentication

**User Auth (Supabase)**:
- Routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected routes: `/dashboard`, `/quests`, `/shop`, `/profile`, `/parent`, `/leaderboard`, `/adventures`, `/capsule`, `/story`, `/settings`
- `middleware.ts` handles redirects for unauthenticated users

**Admin Auth (Supabase with role check)**:
- Uses same Supabase Auth as users, but requires `role: 'admin'` in profile
- Routes under `/admin/*` checked by middleware and `admin/layout.tsx`
- Non-admins redirected to `/dashboard`

### User Roles

- `student` - Regular user who completes quests and earns rewards
- `parent` - Can view child's progress and approve activities
- `admin` - Full administrative access

### Database Schema

Key tables (see `supabase/schema.sql` for full schema):
- `profiles` - User data extending Supabase auth (XP, emeralds, streaks)
- `activities` - Available quests with XP/emerald rewards
- `completed_activities` - Activity submissions with pending/approved/rejected status
- `shop_items` - Rewards purchasable with emeralds
- `purchases` - Purchase history
- `mystery_boxes` - 7-day streak reward tracking

Motivation 3.0 tables (see `supabase/motivation_3_migration.sql`):
- `skill_areas` - Subject areas (math, Czech, logic) for skill tracking
- `skill_progress` - User mastery level per skill area (exploring→growing→confident→teaching)
- `learning_days` - Daily learning records (replaces punitive streaks)
- `family_adventures` - Shared family goals with point contributions
- `recognitions` - "Now-that" recognition messages from parents
- `time_capsules` - Letters to future self with goals and reflections

### API Routes

- `/api/admin/*` - Admin/parent endpoints (users, activities, purchases, approvals)
- `/api/notifications/approval-request` - Email notifications for parent approval flow
- `/api/notifications/parent-link-request` - Email with verification code for parent-child linking
- `/api/parent/add-child` - Parent initiates child linking (creates pending link)
- `/api/parent/verify-link` - Child confirms parent link with verification code

All admin routes use `requireAdmin()` or `requireAdminOrParent()` from `lib/supabase/admin.ts` for authorization.

### Theme System

Three visual themes with complete style systems:
- **Minecraft** (default): Dark, pixelated, emerald currency
- **Unicorn**: Light, magical, stars currency
- **K-pop**: Dark, modern, gems currency

Theme is stored in user profile and applied via CSS custom properties in `ThemeContext.tsx`. A blocking script in the root layout applies theme CSS variables before React hydration to prevent FOUC (Flash of Unstyled Content).

### Game Mechanics

- **XP & Levels**: 6 levels with progressive thresholds (0→100→300→600→1000→2000 XP). Level names theme-specific.
- **Emeralds**: In-game currency spent in shop
- **Streaks**: Daily activity tracking (Czech timezone), resets after missing a day
- **Mystery Boxes**: Earned at 7-day streaks, tiered rewards (common 60%/rare 30%/legendary 10%)
- **Flawless Bonus**: 2x emeralds when score meets activity's `flawless_threshold`

## Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin API routes only
RESEND_API_KEY=your_resend_api_key  # For email notifications (not in example file)
```

## Supabase Setup

Run SQL files in Supabase SQL Editor in order:
1. `supabase/schema.sql` - Core schema, RLS policies, triggers, seed data
2. `supabase/add_min_level.sql` - Shop item level requirements
3. `supabase/add_theme_column.sql` - User theme preferences
4. `supabase/atomic_operations.sql` - Safe concurrent update functions (increment/decrement emeralds, etc.)
5. `supabase/motivation_3_migration.sql` - Motivation 3.0 schema (skill areas, learning days, family adventures)
6. `supabase/time_capsule.sql` - Time capsule feature tables
7. `supabase/seed_rewards.sql` - Additional reward items (if needed)
8. `supabase/pending_parent_links.sql` - Secure parent-child verification system
9. `supabase/family_scoping.sql` - Per-family activities and shop items
10. `supabase/activity_date_migration.sql` - Activity date column for historical submissions

Utility scripts (not for initial setup):
- `supabase/complete_reset.sql` - Drops all data and recreates schema (development only)
- `supabase/fix_link_child_to_parent.sql` - Security fix for existing installations

## Supabase Client Usage

- **`lib/supabase/client.ts`**: Use `createClient()` in `'use client'` components for browser-side operations
- **`lib/supabase/server.ts`**: Use `createServerClient()` in Server Components and API routes (handles cookies)
- **`lib/supabase/admin.ts`**: Use `createAdminClient()` only in API routes for privileged operations. Includes `requireAdmin()` and `requireAdminOrParent()` helpers for role verification

## PWA Support

The app is configured as a Progressive Web App:
- `public/manifest.json` - App metadata, icons, display mode
- `public/sw.js` - Service worker for offline caching
- `components/InstallPrompt.tsx` - Install banner for mobile users
- `components/ServiceWorkerRegistration.tsx` - Registers SW on app load

## Custom Agents

### motivation-consultant

Use this agent when designing or reviewing motivational features, gamification elements, rewards, or any user-facing messaging that aims to motivate children to learn.

**Agent instructions:**

Jsi odborník na motivaci dětí k učení, založený na principech knihy "Drive" od Daniela Pinka. Tvým úkolem je pomáhat navrhovat motivační prvky pro vzdělávací aplikaci AcademyCraft tak, aby podporovaly vnitřní motivaci, ne ji ničily.

**Tři pilíře Motivace 3.0:**

1. **AUTONOMIE** - Touha řídit svůj vlastní život
   - Dej dětem volbu v tom, CO dělat (ne jen JAK)
   - Nabízej různé cesty k cíli
   - Respektuj jejich tempo a styl učení
   - Ptej se: "Má dítě pocit, že to dělá proto, že chce, nebo proto, že musí?"

2. **MASTERY (Mistrovství)** - Touha být stále lepší v něčem důležitém
   - Zaměř se na osobní růst, ne na srovnávání s ostatními
   - Ukazuj pokrok oproti vlastní minulosti
   - Navrhuj "Goldilocks úkoly" - ani moc lehké, ani moc těžké
   - Slaví zlepšení, ne jen výsledky
   - Ptej se: "Vidí dítě svůj růst?"

3. **PURPOSE (Smysl)** - Touha přispívat k něčemu většímu
   - Vysvětluj PROČ je něco důležité (ne jen co dělat)
   - Propojuj učení s reálným životem
   - Zapoj rodinu - sdílené cíle posilují smysl
   - Ptej se: "Rozumí dítě, proč mu tohle pomůže?"

**Co NEDĚLAT (destruktory vnitřní motivace):**

- ❌ **"If-then" odměny**: "Když uděláš X, dostaneš Y" - snižuje vnitřní zájem o aktivitu
- ❌ **Leaderboardy a žebříčky**: Srovnávání s ostatními demotivuje většinu dětí
- ❌ **Vnější tlak a deadliny**: Stres zabíjí kreativitu a radost z učení
- ❌ **Kontrolující jazyk**: "Musíš", "Měl bys" místo "Můžeš", "Co kdybys"
- ❌ **Příliš mnoho XP/bodů**: Když je všechno o bodech, nic nemá skutečnou hodnotu

**Co DĚLAT (posílení vnitřní motivace):**

- ✅ **"Now-that" uznání**: Nečekané ocenění PO dokončení, ne slib předem
- ✅ **Purpose messages**: Ke každé aktivitě vysvětlení, proč je důležitá
- ✅ **Rodinná dobrodružství**: Společné cíle rodiny místo individuální soutěže
- ✅ **Learning days**: Počítej dny učení, ne streak - bez trestu za vynechání
- ✅ **Skill progress**: Ukazuj růst v konkrétních dovednostech
- ✅ **Mastery levels**: "Zkoumám → Rostu → Věřím si → Můžu učit" místo čísel

**Praktické příklady pro AcademyCraft:**

| Špatně (Motivace 2.0) | Dobře (Motivace 3.0) |
|----------------------|----------------------|
| "Získej 50 XP za test" | "Procvič si zlomky - hodí se ti při vaření a nakupování" |
| "Jsi na 5. místě v žebříčku" | "Zlepšil ses o 15% oproti minulému týdnu" |
| "Streak 7 dní = mystery box" | "Rodina nasbírala 80 bodů - jedeme na výlet!" |
| "Musíš udělat 3 úkoly denně" | "Které úkoly tě dnes lákají?" |
| "Ztratíš streak!" | "Včera ses neučil - to je OK, dnes můžeš znovu" |

**Při review kódu nebo návrhu se ptej:**

1. Posiluje tohle autonomii, mastery nebo purpose?
2. Mohlo by tohle snížit vnitřní motivaci dítěte?
3. Je odměna "if-then" nebo "now-that"?
4. Srovnáváme s ostatními nebo s vlastní minulostí?
5. Rozumí dítě, PROČ to dělá?

**Cílová skupina:** Děti kolem 10 let připravující se na přijímačky. Potřebují cítit, že učení má smysl a že mají kontrolu nad svým pokrokem.
