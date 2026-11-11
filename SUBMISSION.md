# Submission — AI Health Records Assistant

## What It Is

A web app that turns health documents into plain-English summaries.
Upload or paste a discharge summary, lab report, or insurance letter and
get a summary, key findings, a lab table with high/low flags, a follow-up
checklist, questions to ask your doctor, and answers grounded in the
document — plus a FHIR Bundle viewer.

**Live: TBD — will be added after Vercel deployment**

## Stack

Next.js 16 (App Router, TypeScript, Tailwind 4, Turbopack), React 19,
lucide-react, Zod, Vitest + Testing Library + jsdom. No LLM API key:
all “AI” features are deterministic, rule-based logic in `src/lib/`
(see README for how it works).

## What Works End to End

- My Records: search/filter, upload (.txt/.md, max 1 MB) or paste,
  create, delete with confirmation, export all as JSON
- 3 fictional SAMPLE records seeded on first load (discharge summary,
  lab report, insurance letter)
- Document detail: rule-based summary (dates, medications, labs with
  reference-range flags, diagnoses, follow-ups), persisted checklist,
  Q&A with line citations and “Not found in this document”, full text,
  export summary as Markdown
- FHIR Viewer: paste a FHIR R4 Bundle, Zod validation, date-sorted
  timeline, sample bundle included
- Privacy banner on every page: demo app, do not upload real PHI, not
  medical advice, data stays in the browser

## Verification

- `npm test` — 33 tests, all passing (summarize, Q&A, FHIR, validation,
  components)
- `npm run build` — passes
- `npm run lint` — clean

## What Would Be Added Next

Real LLM summaries (with the rule-based extractor kept as a verifiable
fallback), Supabase Auth + RLS, HL7/FHIR server integration (SMART on
FHIR), PDF upload/OCR, lab-trend charts.
