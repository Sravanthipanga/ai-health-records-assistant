# Architecture — AI Health Records Assistant

## Overview

A Next.js 16 App Router app. All logic runs in the browser; there is no
backend server and no database. Records live in `localStorage` (with an
in-memory fallback when storage is unavailable).

## Routes

| Route | Purpose |
| --- | --- |
| `/` | My Records — search/filter, add (upload or paste), delete, export all |
| `/records/[id]` | Document detail — AI Summary, lab table, checklist, Q&A, full text, export .md |
| `/fhir` | FHIR Viewer — paste/validate a FHIR R4 Bundle, view a timeline |

## Source Layout

```
src/
  app/
    layout.tsx          Header, nav, disclaimer banner, footer
    page.tsx            My Records (client component)
    records/[id]/page.tsx   Detail page (client component)
    fhir/page.tsx       FHIR Viewer (client component)
    globals.css         Tailwind 4 import
  components/           (none yet — pages own their UI; shared pieces
                         would go here as the app grows)
  lib/
    summarize.ts        Rule-based summary extraction
    qa.ts               Keyword/retrieval Q&A with citations
    fhir.ts             Zod FHIR R4 schemas + timeline builder
    sampleFhir.ts       Valid sample FHIR Bundle (fictional)
    seed.ts             3 fictional sample records
    store.ts            localStorage persistence + checklist state
    validation.ts       Zod record schema + upload validation
    export.ts           Markdown/JSON download helpers
  types/index.ts        HealthRecord, Summary, LabValue, Medication, QaAnswer
tests/
  summarize.test.ts     Medications, labs, diagnoses, dates, follow-ups
  qa.test.ts            Found / not-found / citations
  fhir.test.ts          Valid bundle, invalid JSON, non-Bundle, empty
  validation.test.ts    Record schema + upload rules
  components.test.tsx   Home page renders sample records
```

## Data Flow

1. On first load, `loadRecords()` seeds `localStorage` with the three
   fictional sample records (`hra-records-v1`).
2. Creating a record validates it with Zod, prepends it, and saves the
   whole list back to `localStorage`.
3. The detail page calls `summarizeDocument(content, type)` in a
   `useMemo`. The summary is pure: same text in, same summary out.
4. Checklist state is stored separately (`hra-checklist-v1`), keyed by
   document id, so checking an item survives refresh and does not
   rewrite the record.
5. Q&A runs `answerQuestion(content, question)` on demand; it never
   calls a network API.
6. The FHIR viewer parses pasted JSON with `JSON.parse`, validates it
   with the Zod bundle schema, and renders `bundleToTimeline()` output.

## Design Decisions

- **Rule-based, not LLM.** The brief required no API key. Deterministic
  extraction is also easier to test and to audit: every summary fact
  can be traced to a line in the source document.
- **localStorage, not a server DB.** Keeps health-adjacent data on the
  user’s device, which matches the privacy story. The trade-off is that
  records do not sync across devices — a future Supabase + Auth + RLS
  step would fix that.
- **Permissions / sharing are out of scope** for this build (unlike the
  Ajaia Docs project, which had them). Records are single-user, local.
- **Zod everywhere a boundary is crossed:** record creation, file
  upload rules, and FHIR input.
- **Vitest 5 needs `vite` and `@testing-library/dom` as explicit
  devDependencies**, and the `@/` alias must be declared in
  `vitest.config.ts` (Vitest does not read `tsconfig.json` paths).
  `.npmrc` sets `legacy-peer-deps=true` because Vitest 5’s peer range
  for `@types/node` conflicts with the version scaffolded by
  create-next-app.

## Known Limitations

- Extraction only recognises the medications, conditions, and lab tests
  in its curated lists (plus generic “Name + dosage” patterns). An
  unusual drug name or a lab test outside the list may be missed.
- Lab reference ranges are read from the same line as the value; a
  document that lists ranges in a separate table will not be flagged.
- FHIR support covers five resource types; other resources in a bundle
  fail validation rather than being ignored.
- No PDF upload, no OCR, no real-time collaboration.
