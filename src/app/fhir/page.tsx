"use client";

import { useState } from "react";
import { Braces, FileJson2, ListOrdered, TriangleAlert } from "lucide-react";
import { bundleToTimeline, parseFhirBundle, type TimelineEntry } from "@/lib/fhir";
import { SAMPLE_FHIR_BUNDLE } from "@/lib/sampleFhir";

export default function FhirViewerPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  function handleView() {
    const result = parseFhirBundle(input);
    if (!result.ok || !result.bundle) {
      setError(result.error ?? "Could not parse this bundle.");
      setTimeline(null);
      setCounts(null);
      return;
    }
    setError(null);
    setTimeline(bundleToTimeline(result.bundle));
    const map: Record<string, number> = {};
    for (const entry of result.bundle.entry) {
      const t = entry.resource.resourceType;
      map[t] = (map[t] ?? 0) + 1;
    }
    setCounts(map);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Braces className="h-6 w-6 text-teal-600" aria-hidden /> FHIR Viewer
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Paste a FHIR R4 Bundle (JSON) containing Patient, Observation,
          Condition, MedicationRequest, and Encounter resources. It is validated
          with Zod and rendered as a readable timeline. Nothing is uploaded —
          parsing happens in your browser.
        </p>
        <div className="mt-4">
          <label htmlFor="fhir-input" className="mb-1 block text-sm font-medium">
            FHIR Bundle JSON
          </label>
          <textarea
            id="fhir-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={12}
            placeholder='{"resourceType": "Bundle", "type": "collection", "entry": [...]}'
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-teal-600 focus:outline-none"
          />
        </div>
        {error && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleView}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <FileJson2 className="h-4 w-4" aria-hidden /> Validate &amp; view
          </button>
          <button
            type="button"
            onClick={() => { setInput(SAMPLE_FHIR_BUNDLE); setError(null); }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Load sample FHIR bundle
          </button>
          <button
            type="button"
            onClick={() => { setInput(""); setTimeline(null); setCounts(null); setError(null); }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Clear
          </button>
        </div>
      </section>

      {counts && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Bundle contents</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(counts).map(([type, n]) => (
              <span key={type} className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-800">
                {n} × {type}
              </span>
            ))}
          </div>
        </section>
      )}

      {timeline && (
        <section aria-label="FHIR timeline" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ListOrdered className="h-5 w-5 text-teal-600" aria-hidden /> Timeline
          </h2>
          {timeline.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No entries found in this bundle.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {timeline.map((entry, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                    {i + 1}
                  </span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {entry.type}
                      </span>
                      {entry.date && (
                        <span className="text-xs font-medium text-slate-500">{entry.date}</span>
                      )}
                    </div>
                    <p className="mt-1 font-semibold">{entry.title}</p>
                    {entry.detail && <p className="text-sm text-slate-600">{entry.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {!timeline && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No bundle loaded yet. Click “Load sample FHIR bundle”, then “Validate &amp; view” to see it in action.
        </div>
      )}
    </div>
  );
}
