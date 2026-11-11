# AI Workflow — AI Health Records Assistant

## What Was Built With AI

This app was built with **Muse** (Meta’s personal AI agent, powered by
the Muse Spark model) as the coding assistant, working from a written
brief: a complete Next.js health-records app with rule-based summaries,
grounded Q&A, a FHIR viewer, tests, and docs — no LLM API key, no
deployment, local build and verification only.

## What the AI Did

- Scaffolded the Next.js 16 + TypeScript + Tailwind 4 project and
  installed dependencies (lucide-react, zod, Vitest, Testing Library,
  jsdom).
- Designed the data model (`HealthRecord`, `Summary`, `LabValue`,
  `Medication`, `QaAnswer`) and the file layout under `src/lib/`,
  `src/app/`, and `tests/`.
- Implemented the rule-based summarizer (`summarize.ts`), the grounded
  Q&A (`qa.ts`), FHIR validation and timeline building (`fhir.ts`),
  localStorage persistence (`store.ts`), and validation (`validation.ts`).
- Built the three pages (My Records, document detail, FHIR Viewer) with
  search/filter, upload/paste, delete confirmation, checklist
  persistence, and Markdown/JSON export.
- Wrote 33 tests across five test files and the README, architecture,
  and submission notes.

## What the Human Verified / Changed

(The brief for this build was reviewed by the human owner; the checks
below are the verification steps run for this deliverable.)

- **Tests were actually run, not just written:** `npm test` was run
  after the first draft — 31 of 33 tests passed. The two failures were
  real bugs, fixed and re-tested:
  1. Albuterol was missed because its line reads “Albuterol inhaler
     90 mcg” — the medication regex required the dosage immediately
     after the drug name. Fixed to allow an optional “inhaler”.
  2. A component test used `getByText` for a badge that appears on all
     three sample records. Fixed to assert all three.
  After the fixes, all 33 tests pass.
- **Build and lint were run:** `npm run build` and `npm run lint` were
  run and must pass before the app is handed over (see SUBMISSION.md
  for the recorded results).
- **No code was copied from other projects.** The app was written from
  scratch for this brief; the Next.js scaffold itself comes from
  `create-next-app`.
- **No real health data was used.** All sample records and the sample
  FHIR bundle use a fictional patient and invented values, clearly
  labeled SAMPLE.
- **No API keys or secrets** were used or stored anywhere in the app.

## What AI Did Not Do

- AI did not deploy the app, push it to GitHub, or create any accounts
  — the brief explicitly limited this step to a local build.
- AI did not provide medical advice. The summarizer only restates and
  reorganises text that is already in the document, and every page
  carries a “not medical advice / rule-based, not a diagnosis” notice.
