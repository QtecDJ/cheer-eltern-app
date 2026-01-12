# App Router Best Practices - Quick Reference

Dieses Dokument dient als Quick-Reference für die Entwicklung neuer Features und Pages in der Eltern-App, um die Optimierungen aus v1.8.0 beizubehalten.

---

## 🚫 DON'Ts - Was du NICHT tun solltest

### ❌ 1. NIEMALS DB Queries in Layout Files

```tsx
// ❌ FALSCH - Layout wird bei jeder Navigation gerendert
export default async function Layout() {
  const data = await prisma.member.findUnique(...); // ← NIEMALS!
  return <div>...</div>;
}
```

**Warum:** Layout persistiert über Navigationen → Query wird bei JEDEM Seitenwechsel ausgeführt

**Lösung:** Nutze Session-Daten oder fetche in der Page, nicht im Layout

---

### ❌ 2. NIEMALS direkte prisma Queries in Pages

```tsx
// ❌ FALSCH - Inline Query
export default async function Page() {
  const member = await prisma.member.findUnique({
    where: { id: 1 },
    select: { /* 20 Felder */ }
  });
  return <div>...</div>;
}
```

**Warum:** Nicht wiederverwendbar, nicht optimiert, keine zentrale Kontrolle

**Lösung:** Nutze Query Library aus `src/lib/queries.ts`

---

### ❌ 3. NIEMALS SELECT * (implicit)

```tsx
// ❌ FALSCH - Holt ALLE Felder
const member = await prisma.member.findUnique({
  where: { id: 1 }
});

// ❌ FALSCH - Holt zu viele Felder
const member = await prisma.member.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    name: true,
    email: true,
    // ...30+ weitere Felder
  }
});
```

**Warum:** Verschwendet Bandwidth → Neon charged by bytes transferred

**Lösung:** Nur die wirklich benötigten Felder selektieren

---

### ❌ 4. NIEMALS Full Records nach Updates zurückgeben

```tsx
// ❌ FALSCH - Gibt full Member zurück
export async function updateProfile(data) {
  const updated = await prisma.member.update({
    where: { id: 1 },
    data
  });
  return updated; // ← 40+ Felder zurück!
}
```

**Warum:** Unnecessary Data Transfer

**Lösung:** Nur `{ success: boolean, error?: string }` zurückgeben

---

### ❌ 5. NIEMALS DB Queries in Client Components

```tsx
"use client"; // ← Client Component

import { prisma } from "@/lib/db"; // ❌ FALSCH!

export function MyComponent() {
  const data = await prisma.member.findMany(); // ← Runtime Error!
}
```

**Warum:** prisma läuft nur auf dem Server

**Lösung:** Daten als Props von Server Component übergeben

---

### ❌ 6. NIEMALS N+1 Query Patterns

```tsx
// ❌ FALSCH - N+1 Problem
const members = await prisma.member.findMany();
for (const member of members) {
  const team = await prisma.team.findUnique({
    where: { id: member.teamId }
  }); // ← Separater Query für JEDEN Member!
}
```

**Warum:** 1 Query + N Queries = Katastrophale Performance

**Lösung:** Nutze `include` oder separate Queries mit `IN` Filter

---

### ❌ 7. NIEMALS unbegrenzte Listen

```tsx
// ❌ FALSCH - Könnte Tausende zurückgeben
const members = await prisma.member.findMany({
  where: { status: "active" }
});
```

**Warum:** Unbounded Data Transfer

**Lösung:** IMMER `take` limit setzen

---

## ✅ DO's - Best Practices

### ✅ 1. Nutze Query Library

```tsx
// ✅ RICHTIG
import { getMemberForHome } from "@/lib/queries";

export default async function HomePage() {
  const member = await getMemberForHome(session.id);
  return <HomeContent member={member} />;
}
```

**Vorteile:**
- Wiederverwendbar
- Zentral optimiert
- Minimale Selects
- Konsistente Error Handling

---

### ✅ 2. Explizite Selects mit nur benötigten Feldern

```tsx
// ✅ RICHTIG - Nur 4 Felder
const member = await prisma.member.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    name: true,
    email: true,
    teamId: true,
  }
});
```

**Faustregel:** Wenn du nur 5 Felder brauchst, hole nur 5 Felder

---

### ✅ 3. Nutze Session-Daten statt DB Queries

```tsx
// ✅ RICHTIG - Aus Session Cookie
const session = await getSession();
const userRole = session?.userRole; // ← Gecacht!

// ❌ FALSCH - Redundanter Query
const member = await prisma.member.findUnique({
  where: { id: session.id },
  select: { userRole: true }
});
```

**Session enthält:**
- id, name, firstName, lastName
- email, teamId, teamName
- **userRole** ← Wichtig!

---

### ✅ 4. Minimale Server Action Responses

```tsx
// ✅ RICHTIG
export async function updateProfile(data) {
  await prisma.member.update({
    where: { id: 1 },
    data
  });
  
  revalidatePath("/profil");
  return { success: true };
}

// ❌ FALSCH
export async function updateProfile(data) {
  const updated = await prisma.member.update({
    where: { id: 1 },
    data
  });
  return updated; // ← Zu viel!
}
```

**Response Format:**
```typescript
{ success: boolean, error?: string }
```

---

### ✅ 5. Server/Client Component Trennung

```tsx
// ✅ RICHTIG

// page.tsx (Server Component)
export default async function Page() {
  const data = await getData(); // ← DB Query hier
  return <ClientContent data={data} />;
}

// client-content.tsx (Client Component)
"use client";
export function ClientContent({ data }) {
  // ← Keine DB Queries, nur UI Logic
  return <div>...</div>;
}
```

---

### ✅ 6. Includes optimiert nutzen

```tsx
// ✅ RICHTIG - Nur benötigte Relation-Felder
const member = await prisma.member.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    name: true,
    team: {
      select: {
        id: true,
        name: true,
        color: true, // ← Nur 3 Felder statt 12+
      }
    }
  }
});
```

---

### ✅ 7. IMMER take Limits setzen

```tsx
// ✅ RICHTIG
const members = await prisma.member.findMany({
  where: { status: "active" },
  take: 100, // ← Max Limit
  orderBy: { name: "asc" }
});
```

**Empfohlene Limits:**
- Listen: 50-100
- Dashboards: 5-10
- Infinite Scroll: 20-30 per Page

---

## 📋 Checkliste für neue Pages

Wenn du eine neue Page erstellst:

- [ ] **Page ist Server Component** (kein `"use client"`)
- [ ] **Query aus `src/lib/queries.ts`** nutzen (oder neue erstellen)
- [ ] **Session-Daten nutzen** für userRole, teamId, etc.
- [ ] **Keine DB Queries im Layout**
- [ ] **Client Component** nur für UI Logic (als `-content.tsx`)
- [ ] **Revalidate** Zeit setzen (`export const revalidate = X`)
- [ ] **DTOs nutzen** für Type Safety (optional)
- [ ] **Error Handling** implementieren
- [ ] **TypeScript Clean** vor Commit

---

## 📋 Checkliste für neue Server Actions

Wenn du eine neue Server Action erstellst:

- [ ] **`"use server"`** Directive oben
- [ ] **Session Check** durchführen
- [ ] **Explizite Selects** bei Queries
- [ ] **Minimale Response** (`{ success, error }`)
- [ ] **revalidatePath()** aufrufen nach Updates
- [ ] **Try/Catch** Error Handling
- [ ] **TypeScript Types** definieren
- [ ] **Keine Full Records** returnen

---

## 📋 Checkliste für neue Queries

Wenn du eine neue Query in `src/lib/queries.ts` erstellst:

- [ ] **JSDoc Comment** mit Beschreibung
- [ ] **Explizite Select** mit nur benötigten Feldern
- [ ] **`take` Limit** bei findMany
- [ ] **Optimierte Includes** (nur benötigte Relation-Felder)
- [ ] **TypeScript Return Type** definieren
- [ ] **DTO** erstellen (optional, aber empfohlen)
- [ ] **Kategorie** im File (Member/Event/Training/etc.)
- [ ] **Test** durchführen

---

## 🎯 Query Optimization Cheat Sheet

### Daten-Größen (ungefähr)

| Query Type | Full Model | Optimized | Savings |
|------------|-----------|-----------|---------|
| Single Member | ~2 KB | ~200 bytes | 90% |
| Member List (100) | ~200 KB | ~20 KB | 90% |
| Event with Polls (5-level) | ~50 KB | ~10 KB | 80% |
| Training Session | ~5 KB | ~500 bytes | 90% |
| Attendance Record | ~1 KB | ~100 bytes | 90% |

### Typische Optimierungen

```tsx
// Member Full → Member List
Full: 40+ Felder → List: 4 Felder (id, firstName, lastName, photoUrl)
Savings: ~95%

// Member with Team → Minimal
Full Team: 12 Felder → Minimal: 3 Felder (id, name, color)
Savings: ~75%

// Poll with Votes → Poll Summary
Full: 5-level deep → Summary: 3-level with _count
Savings: ~80%

// Attendance with Relations → Status Only
Full: Member + Training → Status: Only status/reason/notes
Savings: ~90%
```

---

## 🚀 Performance Targets

### Query Response Times (Server)

- **Home Page:** < 200ms
- **Event List:** < 150ms
- **Training List:** < 150ms
- **Profile:** < 200ms
- **Admin Pages:** < 300ms

### Data Transfer per Page

- **Home:** < 10 KB
- **Events:** < 15 KB
- **Training:** < 10 KB
- **Profile:** < 20 KB
- **Admin Lists:** < 50 KB

Wenn du diese Werte überschreitest, optimiere die Queries!

---

## 📚 Referenzen

- **Query Library:** [src/lib/queries.ts](src/lib/queries.ts)
- **DTOs:** [src/lib/dtos.ts](src/lib/dtos.ts)
- **Optimization Guide:** [QUERY_OPTIMIZATION.md](QUERY_OPTIMIZATION.md)
- **Summary:** [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md)

---

## 💡 Pro Tips

1. **Measure First:** Nutze Query Monitor bevor du optimierst
2. **Profile in Production:** Neon Dashboard zeigt echte Transfer-Zahlen
3. **Keep it DRY:** Queries wiederverwendbar machen
4. **Document Everything:** JSDoc Comments in Query Library
5. **Type Safe:** DTOs für alle großen Queries erstellen
6. **Test Edge Cases:** Empty Lists, Null Values, Missing Relations

---

**Frage dich immer:** "Brauche ich wirklich ALL diese Daten?" 🤔

Wenn nein → Optimiere!
