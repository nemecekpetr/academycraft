# AcademyCraft: Plán Motivace 3.0

Tento dokument obsahuje návrhy změn aplikace AcademyCraft na základě principů z knihy Daniela Pinka "Drive" (Pohon), optimalizované pro 10letou studentku připravující se na přijímací zkoušky CERMAT.

---

## Shrnutí klíčových principů

**Motivace 3.0** stojí na třech pilířích:
1. **Autonomie** - touha řídit svůj vlastní život
2. **Mistrovství** - touha zlepšovat se v něčem, na čem záleží
3. **Smysl** - touha dělat něco pro větší účel než jsme my sami

**Kritické poznatky z knihy:**
- **If-then odměny** ("Splníš úkol → dostaneš emeraldy") ničí vnitřní motivaci
- **Sawyerův efekt**: Odměny mohou proměnit hru v práci (negativní) nebo práci ve hru (pozitivní)
- **Děti jsou přirozeně Type I** (vnitřně motivované) - systém by je neměl přeměňovat na Type X
- **Goldilocks úkoly**: Optimální jsou úkoly, které nejsou ani příliš lehké, ani příliš těžké
- **Flow stav**: Nejvyšší angažovanost nastává, když výzva odpovídá schopnostem

---

## Současný stav AcademyCraft - Analýza rizik

### Potenciálně problematické prvky (Motivace 2.0):

| Prvek | Riziko podle Drive |
|-------|-------------------|
| XP za splnění úkolu | If-then odměna - může snížit vnitřní zájem o učení |
| Emeraldy za aktivity | Podmíněná odměna - mění učení na "práci za mzdu" |
| Streak systém | Vytváří tlak a úzkost, trestá za vynechání dne |
| Leaderboard | Srovnávání s ostatními podporuje Type X chování |
| Flawless bonus (2x) | If-then odměna vázaná na výkon - může vyvolat strach z chyb |
| Mystery box po 7 dnech | Silná if-then odměna - motivuje k "odškrtávání" místo učení |

### Dobré prvky (už podporují Motivaci 3.0):

| Prvek | Proč funguje |
|-------|-------------|
| Minecraft téma | Spojuje učení s něčím, co dítě baví |
| Level tituly | Ukazují progres a růst (ne srovnání s ostatními) |
| Rodičovský dohled | Přidává smysl - "dělám to pro rodinu" |
| Různé typy aktivit | Určitá míra autonomie ve výběru |

---

## Doporučené změny

### 1. AUTONOMIE - Čtyři T (Task, Time, Technique, Team)

#### 1.1 Task (Úkol) - Co se učit

**Současný stav:** Rodič/admin definuje dostupné questy.

**Návrh změn:**
- [ ] Přidat **"Volný quest"** - student si může sám navrhnout, co chce procvičovat
- [ ] Implementovat **denní výběr** - nabídnout 3-5 questů, student si vybere jeden hlavní
- [ ] Přidat **"FedEx Day"** - jednou týdně možnost studovat cokoliv (i mimo CERMAT látku)
- [ ] Umožnit studentovi **označit preferované předměty** - systém pak nabízí více z oblíbených

```
Příklad UI:
┌─────────────────────────────────────┐
│  Dnešní výběr                       │
│  ─────────────────                  │
│  ○ Matematika: Zlomky               │
│  ○ Čeština: Vyjmenovaná slova       │
│  ○ Vlastní téma: ______________     │
│                                     │
│  [Vybrat a začít]                   │
└─────────────────────────────────────┘
```

#### 1.2 Time (Čas) - Kdy se učit

**Současný stav:** Streak systém tlačí k dennímu plnění.

**Návrh změn:**
- [ ] **Změnit streak na "týdenní cíl"** místo denního tlaku
  - Např. "Splň 5 aktivit tento týden" místo "Udrž denní streak"
- [ ] **Odstranit penalizaci** za vynechaný den - žádné "ztracené" streaky
- [ ] Přidat **flexibilní plánování** - student si může nastavit vlastní rozvrh
- [ ] Implementovat **"Tichý režim"** - možnost vypnout notifikace na určité dny

```
Příklad nového systému:
┌─────────────────────────────────────┐
│  Týdenní progres                    │
│  ═══════════════                    │
│  ████████░░░░░░░░  5/10 aktivit     │
│                                     │
│  "Super, jsi v polovině týdne!"     │
│  (Žádný trest za tempo)             │
└─────────────────────────────────────┘
```

#### 1.3 Technique (Technika) - Jak se učit

**Současný stav:** Aktivity mají pevně daný formát.

**Návrh změn:**
- [ ] Nabídnout **více formátů** pro stejnou látku:
  - Video tutoriál
  - Interaktivní kvíz
  - Čtení s otázkami
  - Praktické cvičení
- [ ] Přidat **vlastní tempo** - žádný časový limit na dokončení
- [ ] Umožnit **opakování bez penalizace** - "Chceš si to zkusit znovu?"
- [ ] Implementovat **"Sandbox režim"** - procvičování bez hodnocení

#### 1.4 Team (Tým) - S kým se učit

**Návrh nových funkcí:**
- [ ] **Studijní skupiny** - možnost pozvat kamarády
- [ ] **Párové výzvy** - spolupráce místo soutěžení
- [ ] **Rodinný režim** - rodič může "hrát" spolu s dítětem
- [ ] **Mentor systém** - starší studenti pomáhají mladším

---

### 2. MISTROVSTVÍ - Goldilocks, Flow, Growth Mindset

#### 2.1 Goldilocks úkoly (Adaptivní obtížnost)

**Návrh implementace:**

```typescript
// Pseudokód pro adaptivní obtížnost
interface ActivityDifficulty {
  currentLevel: 1 | 2 | 3 | 4 | 5;
  adjustBasedOn: (recentPerformance: number[]) => number;
}

// Pravidla:
// - 3x za sebou >80% → zvýšit obtížnost
// - 2x za sebou <50% → snížit obtížnost
// - Ideální zóna: 60-80% úspěšnost (flow state)
```

- [ ] Implementovat **5 úrovní obtížnosti** pro každý typ úlohy
- [ ] Přidat **automatické přizpůsobení** na základě výsledků
- [ ] Zobrazit studentovi jeho **"zónu flow"** - kde se cítí nejlépe
- [ ] Umožnit **ruční přepnutí obtížnosti** ("Chci větší výzvu")

#### 2.2 Flow State podpora

**Návrh změn:**
- [ ] **Minimalizovat přerušení** během aktivity
  - Žádné popup notifikace
  - Odměny zobrazit až na konci session
- [ ] Přidat **"Focus mode"** - čistý interface bez rozptylování
- [ ] Implementovat **session timer** s přestávkami (Pomodoro styl, ale dobrovolný)
- [ ] Po dokončení zobrazit **reflexi**: "Jak ses cítil/a? Bylo to akorát náročné?"

#### 2.3 Growth Mindset messaging

**Změnit jazyk v celé aplikaci:**

| Původní (Fixed mindset) | Nové (Growth mindset) |
|------------------------|----------------------|
| "Jsi chytrý/á!" | "Skvěle ses snažil/a!" |
| "100% - Perfektní!" | "Vidím tvůj pokrok!" |
| "Chyba" | "Příležitost k učení" |
| "Nesprávně" | "Zkus to jinak" |
| "Level 5 hráč" | "Stále se zlepšuješ" |

**Konkrétní změny:**
- [ ] **Feedback po aktivitě** zaměřit na proces, ne výsledek:
  - "Strávil/a jsi 15 minut procvičováním - to je skvělá práce!"
  - "Zkusil/a jsi 3 různé přístupy - přesně tak se učí!"
- [ ] **Vizualizace růstu** - graf ukazující zlepšení v čase
- [ ] **Slavit snahu**, ne jen úspěch:
  - Badge za "Nevzdal/a ses po chybě"
  - Badge za "Zkusil/a jsi těžší úroveň"

#### 2.4 Learning Goals vs Performance Goals

**Současný stav:** Důraz na skóre a XP (performance goals).

**Návrh změn:**
- [ ] Přidat **osobní cíle**: "Co se chci tento týden naučit?"
- [ ] **Skrýt skóre jako výchozí** - zobrazit jen na vyžádání
- [ ] Implementovat **"Co jsem se naučil/a"** sekci místo jen "Kolik XP mám"
- [ ] Změnit **měřítka úspěchu**:
  - Místo: "Dosáhl/a jsi 500 XP"
  - Nově: "Zvládáš už sčítání zlomků!"

---

### 3. SMYSL - Purpose Beyond Points

#### 3.1 Propojení s reálným světem

**Návrh změn:**
- [ ] Ke každé aktivitě přidat **"Proč se to učím?"**:
  - Zlomky: "Pomůže ti při vaření receptů!"
  - Vyjmenovaná slova: "Budeš psát bez chyb jako profík!"
- [ ] Přidat **"Kde to použiju?"** příběhy z reálného života
- [ ] Implementovat **projektové učení** - větší úkoly s viditelným výstupem

#### 3.2 Rodinná vazba (Purpose through connection)

**Návrh změn:**
- [ ] **Rodičovské zprávy** s povzbuzením (ne jen kontrola)
- [ ] **Společné cíle** rodiny - "Tento měsíc společně..."
- [ ] **"Ukaž rodičům"** tlačítko - sdílení úspěchů
- [ ] **Rodičovská pochvala** v aplikaci - rodič může poslat kudos

#### 3.3 Větší účel

**Návrh změn:**
- [ ] Propojit učení s **budoucími sny**:
  - "Co chceš být, až vyrosteš?"
  - Personalizované propojení: "Veterináři potřebují matematiku pro dávkování léků"
- [ ] Přidat **dobrovolnický prvek**:
  - "Za každých 10 splněných aktivit darujeme knihu potřebným dětem"
  - Spojit učení s něčím větším než body

---

### 4. SYSTÉM ODMĚN - Transformace z 2.0 na 3.0

#### 4.1 Změna typu odměn

**Z If-Then na Now-That:**

| Původní (If-then) | Nové (Now-that) |
|-------------------|-----------------|
| "Splň quest = +50 emeraldů" | Nečekaná odměna: "Wow, všiml jsem si, že ses dnes extra snažil/a!" |
| "Flawless = 2x bonus" | Feedback: "Úžasné soustředění! Tady je překvapení." |
| "7 dní streak = mystery box" | "Tento týden jsi hodně pracoval/a. Máme pro tebe dárek." |

**Implementace:**
- [ ] **Odstranit zobrazení odměny před aktivitou**
- [ ] Odměny dávat **náhodně a nečekaně** po dobrém snažení
- [ ] Zaměřit odměny na **informační feedback**:
  - "Emeraldy za to, že jsi vyzkoušel/a nový typ úlohy"
  - "Bonus za odvahu zkusit těžší úroveň"

#### 4.2 Baseline vs Bonus

**Baseline odměny (vždy):**
- Přístup k novému obsahu
- Vizualizace progresu
- Uznání snahy

**Bonus odměny (nečekané, informační):**
- Za experimentování
- Za vytrvalost
- Za pomoc ostatním

#### 4.3 Shop redesign

**Návrh změn:**
- [ ] **Pouze kosmetické položky** - žádné "power-ups"
- [ ] Přidat položky **odemykané učením**, ne jen emeraldy:
  - "Odemknuto za zvládnutí zlomků" (ne za 500 emeraldů)
- [ ] Implementovat **"Showcase"** - místo nákupu zobrazení úspěchů

---

### 5. KONKRÉTNÍ NOVÉ FUNKCE

#### 5.1 "Můj Progress" Dashboard

```
┌─────────────────────────────────────────────────┐
│  Moje cesta                                     │
│  ══════════                                     │
│                                                 │
│  📊 Co už umím:                                 │
│  ├── Matematika                                 │
│  │   ├── ✅ Sčítání do 100                      │
│  │   ├── ✅ Odčítání do 100                     │
│  │   ├── 🔄 Násobení (70%)                      │
│  │   └── 🔒 Dělení                              │
│  │                                              │
│  📈 Můj růst tento měsíc:                       │
│  [Graf ukazující zlepšení v čase]               │
│                                                 │
│  🎯 Můj cíl: Zvládnout zlomky do konce měsíce   │
└─────────────────────────────────────────────────┘
```

#### 5.2 "Reflection" po session

```
┌─────────────────────────────────────────────────┐
│  Jak to šlo?                                    │
│  ══════════                                     │
│                                                 │
│  Dnes jsi strávil/a 20 minut učením.            │
│  Vyzkoušel/a jsi 12 úloh.                       │
│                                                 │
│  Jak ses cítil/a?                               │
│  😫 Těžké  😐 Akorát  😊 Lehké                  │
│                                                 │
│  Co tě dnes bavilo nejvíc?                      │
│  [________________]                             │
│                                                 │
│  [Uložit a pokračovat zítra]                    │
└─────────────────────────────────────────────────┘
```

#### 5.3 "FedEx Day" - Páteční svoboda

- Každý pátek možnost studovat cokoliv
- Student prezentuje rodičům, co se naučil
- Bez hodnocení, bez emeraldů - čistě pro radost

#### 5.4 "Mentor Badge" systém

Místo soutěžního leaderboardu:
- Studenti, kteří zvládli téma, mohou pomáhat ostatním
- Badge za "Pomohl/a jsem kamarádovi"
- Buduje komunitu místo rivality

---

### 6. IMPLEMENTAČNÍ PRIORITY

#### Fáze 1: Quick Wins (nízká náročnost, vysoký dopad)

1. **Změnit messaging** - growth mindset jazyk
2. **Skrýt XP/emeraldy** během aktivity - zobrazit až na konci
3. **Přidat reflexi** po každé session
4. **Změnit streak na týdenní cíl**

#### Fáze 2: Střední změny

5. **Implementovat výběr aktivit** - autonomie v task
6. **Přidat adaptivní obtížnost** - Goldilocks úkoly
7. **Redesignovat dashboard** - focus na růst, ne body
8. **Přidat "Proč se to učím"** ke každé aktivitě

#### Fáze 3: Větší features

9. **FedEx Day** implementace
10. **Studijní skupiny** a mentor systém
11. **Projektové učení** s reálnými výstupy
12. **Now-that reward engine** - nečekané odměny

---

### 7. MĚŘENÍ ÚSPĚCHU

#### Staré metriky (Motivace 2.0):
- Denní aktivní uživatelé
- Průměrná délka streaku
- XP získané za den

#### Nové metriky (Motivace 3.0):
- **Engagement quality**: Jak dlouho student zůstává v flow?
- **Return rate**: Vrací se student dobrovolně?
- **Mastery progression**: Kolik témat student skutečně zvládl?
- **Self-reported enjoyment**: "Bavilo tě to?"
- **Parent satisfaction**: Vidí rodič skutečný pokrok?

---

## Závěr

AcademyCraft má skvělý základ - Minecraft téma je pro děti atraktivní a gamifikace může fungovat. Klíčem je posun od **vnějších motivátorů** (body, odměny, soutěž) k **vnitřním motivátorům** (volba, růst, smysl).

**Hlavní principy pro implementaci:**

1. **Dávej volbu, ne příkazy** (Autonomie)
2. **Ukazuj růst, ne body** (Mistrovství)
3. **Propojuj s něčím větším** (Smysl)
4. **Překvapuj, netrestej** (Now-that místo If-then)
5. **Chval snahu, ne talent** (Growth mindset)

> "Děti se přirozeně chtějí učit. Naším úkolem není je motivovat, ale nepřekážet jejich přirozené zvědavosti."
> — Adaptováno z principů Drive

---

*Dokument vytvořen na základě kompletní analýzy knihy "Drive: The Surprising Truth About What Motivates Us" od Daniela H. Pinka*
