# Changelog

## [2025-01-17] Motivation 3.0 + Security Code Review

### Nové funkce (Motivation 3.0)

#### Time Capsule (Časová schránka)
- **Soubory:** `src/app/(protected)/capsule/`, `src/components/game/TimeCapsule.tsx`
- **SQL:** `supabase/time_capsule.sql`
- Studenti si mohou vytvořit zprávu pro své budoucí já
- Nastavitelné datum odemčení
- Motivační nástroj pro dlouhodobé cíle

#### Growth Story (Příběh růstu)
- **Soubory:** `src/app/(protected)/story/page.tsx`, `src/components/game/GrowthStory.tsx`
- Vizuální časová osa pokroku studenta
- Zobrazuje milníky, úspěchy a růst v čase

#### Family Adventures (Rodinná dobrodružství)
- **Soubory:** `src/app/(protected)/adventures/`, `src/components/game/FamilyAdventure.tsx`
- Kolaborativní cíle mezi rodiči a dětmi
- Společné sbírání bodů k dosažení odměn
- Posiluje rodinnou spolupráci

#### Skill Constellation (Souhvězdí dovedností)
- **Soubor:** `src/components/game/SkillConstellation.tsx`
- Vizuální reprezentace pokroku v různých oblastech
- Hvězdy reprezentují úroveň zvládnutí

#### Rhythm Golem (Golem rytmu)
- **Soubor:** `src/components/game/RhythmGolem.tsx`
- Virtuální společník sledující konzistenci učení
- Reaguje na pravidelnost aktivit studenta

#### Learning Week (Týden učení)
- **Soubor:** `src/components/game/LearningWeek.tsx`
- Vizualizace týdenního pokroku
- Přehled aktivit za posledních 7 dní

#### Session Reflection (Reflexe po aktivitě)
- **Soubor:** `src/components/game/SessionReflection.tsx`
- Sebehodnocení po dokončení aktivity
- Podporuje metakognitivní dovednosti

#### Weekly Progress (Týdenní pokrok)
- **Soubor:** `src/components/game/WeeklyProgress.tsx`
- Souhrnný přehled týdenních statistik

#### Motivational Quote (Motivační citáty)
- **Soubor:** `src/components/game/MotivationalQuote.tsx`
- Dynamické zobrazování motivačních zpráv

#### Recognition Card (Karta uznání)
- **Soubor:** `src/components/game/RecognitionCard.tsx`
- Zobrazení pochval od rodičů

#### Settings Page (Nastavení)
- **Soubor:** `src/app/(protected)/settings/page.tsx`
- Stránka pro uživatelské preference

---

### Bezpečnostní opravy (Code Review)

#### 🔴 Kritické opravy

##### 1. Open Redirect zranitelnost
- **Soubor:** `src/app/(auth)/callback/route.ts`
- **Problém:** Parametr `next` nebyl validován, útočník mohl přesměrovat uživatele na škodlivou stránku
- **Řešení:** Validace že `next` začíná `/` a nezačíná `//`
```typescript
// Před
const next = searchParams.get('next') ?? '/dashboard'

// Po
const nextParam = searchParams.get('next') ?? '/dashboard'
const next = nextParam.startsWith('/') && !nextParam.startsWith('//')
  ? nextParam
  : '/dashboard'
```

##### 2. Slabá validace tokenu při reset hesla
- **Soubor:** `src/app/(auth)/reset-password/page.tsx`
- **Problém:** Kontrola tokenu pouze podle vzhledu URL
- **Řešení:** Použití Supabase `onAuthStateChange` pro správnou validaci `PASSWORD_RECOVERY` eventu
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    setValidToken(true)
  }
})
```

##### 3. Chybějící chráněné cesty v middleware
- **Soubor:** `src/middleware.ts`
- **Problém:** Nové stránky `/adventures`, `/capsule`, `/story`, `/settings` nebyly chráněny
- **Řešení:** Přidání do pole `protectedPaths`
```typescript
const protectedPaths = [
  '/dashboard', '/quests', '/shop', '/profile',
  '/parent', '/leaderboard', '/adventures',
  '/capsule', '/story', '/settings'
]
```

##### 4. API bypass v ParentDashboard
- **Soubor:** `src/app/(protected)/parent/ParentDashboard.tsx`
- **Problém:** Přímé volání databáze místo API, obcházení autorizační logiky
- **Řešení:** Refaktoring na použití `/api/admin/approvals` endpointu
```typescript
// Před
const supabase = createClient()
await supabase.from('completed_activities').update(...)

// Po
const response = await fetch('/api/admin/approvals', {
  method: 'POST',
  body: JSON.stringify({ activityId, action: 'approve' })
})
```

#### 🟠 Doporučené opravy

##### 5. Chybějící validace role
- **Soubor:** `src/app/api/admin/users/route.ts`
- **Problém:** Admin mohl nastavit libovolnou hodnotu role
- **Řešení:** Validace proti povolenému seznamu
```typescript
const allowedRoles = ['student', 'parent', 'admin']
if (role !== undefined && !allowedRoles.includes(role)) {
  return NextResponse.json(
    { error: `Invalid role. Must be one of: ${allowedRoles.join(', ')}` },
    { status: 400 }
  )
}
```

##### 6. In-memory filtrování → DB filtrování
- **Soubor:** `src/app/api/admin/approvals/route.ts`
- **Problém:** Načtení všech dat a filtrování v JS
- **Řešení:** Filtrování na úrovni databáze
```typescript
if (role === 'parent') {
  const { data: children } = await supabase
    .from('profiles')
    .select('id')
    .eq('parent_id', userId)

  childrenIds = children?.map(c => c.id) || []
  dataQuery = dataQuery.in('user_id', childrenIds)
}
```

##### 7. Duplicitní kód v admin.ts
- **Soubor:** `src/lib/supabase/admin.ts`
- **Problém:** `requireAdmin` a `requireAdminOrParent` měly 90% stejný kód
- **Řešení:** Extrakce do sdílené funkce `requireRole`
```typescript
async function requireRole(allowedRoles: string[]): Promise<{ userId: string; role: string }> {
  // ... společná logika
}

export async function requireAdmin(): Promise<string> {
  const { userId } = await requireRole(['admin'])
  return userId
}

export async function requireAdminOrParent() {
  return requireRole(['admin', 'parent'])
}
```

##### 8. Pagination pro API endpointy
- **Soubory:** `src/app/api/admin/users/route.ts`, `src/app/api/admin/approvals/route.ts`
- **Problém:** Bez paginace by velké množství dat způsobilo problémy
- **Řešení:** Přidání `page` a `limit` parametrů
```typescript
const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
const offset = (page - 1) * limit

// Response includes pagination info
return NextResponse.json({
  data,
  pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
})
```

##### 9. Sdílený state bug pro approval messages
- **Soubor:** `src/app/(protected)/parent/ParentDashboard.tsx`
- **Problém:** Jedna `approvalMessage` proměnná pro všechny aktivity
- **Řešení:** Record s per-activity messages
```typescript
// Před
const [approvalMessage, setApprovalMessage] = useState('')

// Po
const [approvalMessages, setApprovalMessages] = useState<Record<string, string>>({})
```

---

### Odstraněné komponenty

#### DailyChoice
- **Soubor:** `src/components/game/DailyChoice.tsx` (ponechán, ale nepoužíván)
- **Důvod:** Při malém počtu aktivit (~7) nedává smysl zvýrazňovat 3 konkrétní
- **Změna:** Odstraněno z `QuestList.tsx`

---

### Nové API endpointy

| Endpoint | Metoda | Popis |
|----------|--------|-------|
| `/api/admin/activities` | GET, POST, PATCH, DELETE | CRUD pro aktivity |
| `/api/admin/approvals` | GET, POST | Seznam a schválení/zamítnutí aktivit |
| `/api/admin/purchases` | GET | Seznam nákupů s paginací |

---

### Databázové migrace

| Soubor | Popis |
|--------|-------|
| `supabase/motivation_3_migration.sql` | Tabulky pro Motivation 3.0 features |
| `supabase/time_capsule.sql` | Tabulka pro časové schránky |
| `supabase/atomic_operations.sql` | Atomické operace pro bezpečné updaty |
| `supabase/complete_reset.sql` | Kompletní reset schema (dev only) |

---

### Soubory projektu

| Soubor | Popis |
|--------|-------|
| `CLAUDE.md` | Instrukce pro Claude Code |
| `MOTIVATION_PLAN.md` | Plán implementace Motivation 3.0 |

---

### Statistiky commitu

- **Commit hash:** `224846b`
- **Změněných souborů:** 70
- **Přidaných řádků:** +10,445
- **Odebraných řádků:** -2,069
