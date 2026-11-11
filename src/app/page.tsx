"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  FileText,
  FileUp,
  Plus,
  Search,
  Trash2,
  FlaskConical,
  HeartPulse,
  ShieldCheck,
  FilePlus2,
} from "lucide-react";
import type { HealthRecord, RecordType } from "@/types";
import { createRecord, deleteRecord, loadRecords } from "@/lib/store";
import { recordInputSchema, validateUploadFile, RECORD_TYPES } from "@/lib/validation";
import { downloadText, recordsToJson } from "@/lib/export";

const TYPE_STYLES: Record<RecordType, string> = {
  "Discharge Summary": "bg-teal-100 text-teal-800",
  "Lab Report": "bg-sky-100 text-sky-800",
  "Insurance Letter": "bg-violet-100 text-violet-800",
  Other: "bg-slate-200 text-slate-700",
};

const TYPE_ICONS: Record<RecordType, React.ReactNode> = {
  "Discharge Summary": <HeartPulse className="h-4 w-4" aria-hidden />,
  "Lab Report": <FlaskConical className="h-4 w-4" aria-hidden />,
  "Insurance Letter": <ShieldCheck className="h-4 w-4" aria-hidden />,
  Other: <FileText className="h-4 w-4" aria-hidden />,
};

export default function HomePage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RecordType | "All">("All");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RecordType>("Other");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    // Deferred so the first render matches the server HTML, then the
    // browser's stored records hydrate in.
    const timer = window.setTimeout(() => {
      setRecords(loadRecords());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)
      );
    });
  }, [records, query, typeFilter]);

  function handleFile(file: File | undefined) {
    setUploadError(null);
    if (!file) return;
    const err = validateUploadFile(file);
    if (err) {
      setUploadError(err);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setContent(text);
      setTitle(file.name.replace(/\.(txt|md)$/i, "").replace(/[-_]+/g, " "));
      setShowForm(true);
    };
    reader.onerror = () => setUploadError("Could not read that file. Please try again.");
    reader.readAsText(file);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const parsed = recordInputSchema.safeParse({ title, type, content });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    const record = createRecord(parsed.data);
    setRecords((prev) => [record, ...prev]);
    setTitle("");
    setContent("");
    setType("Other");
    setFormError(null);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setRecords(deleteRecord(id));
    setConfirmDeleteId(null);
  }

  if (!loaded) {
    return <p className="text-slate-500">Loading your records…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">My Records</h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload or paste a health document and get a plain-English summary, a
          follow-up checklist, and answers grounded in the document itself.
          Three clearly labeled sample records are included so you can try
          everything without using real health information.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <label htmlFor="search" className="sr-only">Search records</label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or text…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <label htmlFor="type-filter" className="sr-only">Filter by document type</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as RecordType | "All")}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="All">All types</option>
            {RECORD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add a record
          </button>
          <button
            type="button"
            onClick={() => downloadText("health-records-export.json", recordsToJson(records), "application/json")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            <Download className="h-4 w-4" aria-hidden /> Export all (JSON)
          </button>
        </div>
      </section>

      {showForm && (
        <section aria-label="Add a record" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Add a record</h2>
          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label htmlFor="upload" className="mb-1 block text-sm font-medium">
                Upload a file (.txt or .md, max 1 MB)
              </label>
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-slate-400" aria-hidden />
                <input
                  id="upload"
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="text-sm"
                />
              </div>
              {uploadError && <p role="alert" className="mt-1 text-sm text-red-600">{uploadError}</p>}
              <p className="mt-1 text-xs text-slate-500">
                Or paste the text below instead. The file name becomes the title — you can edit it.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="mb-1 block text-sm font-medium">Title</label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lab Report — November 2026"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="record-type" className="mb-1 block text-sm font-medium">Document type</label>
                <select
                  id="record-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as RecordType)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  {RECORD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="content" className="mb-1 block text-sm font-medium">Document text</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Paste the document text here…"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>
            {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                <FilePlus2 className="h-4 w-4" aria-hidden /> Save record
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-3 font-medium">No records match that search.</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a different search or filter, or add a record above.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((record) => (
            <li key={record.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_STYLES[record.type]}`}>
                  {TYPE_ICONS[record.type]} {record.type}
                </span>
                {record.isSample && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    SAMPLE — fictional
                  </span>
                )}
              </div>
              <Link href={`/records/${record.id}`} className="mt-3 font-semibold leading-snug hover:text-teal-700 hover:underline">
                {record.title}
              </Link>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{record.content}</p>
              <p className="mt-3 text-xs text-slate-400">
                Added {new Date(record.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Link href={`/records/${record.id}`} className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-700">
                  View summary
                </Link>
                {confirmDeleteId === record.id ? (
                  <span className="flex items-center gap-2 text-sm">
                    <button type="button" onClick={() => handleDelete(record.id)} className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700">
                      Confirm delete
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(record.id)}
                    aria-label={`Delete ${record.title}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
