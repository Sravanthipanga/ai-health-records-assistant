"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  HelpCircle,
  ListChecks,
  MessageCircleQuestion,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { HealthRecord, QaAnswer } from "@/types";
import { deleteRecord, loadChecklist, loadRecords, saveChecklist } from "@/lib/store";
import { summarizeDocument } from "@/lib/summarize";
import { answerQuestion } from "@/lib/qa";
import { downloadText, summaryToMarkdown } from "@/lib/export";

const SAMPLE_QUESTIONS = [
  "What medications am I taking?",
  "What were my lab results?",
  "When is my follow-up?",
  "What is my diagnosis?",
];

export default function RecordDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<QaAnswer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    // Deferred so the first render matches the server HTML, then the
    // browser's stored record and checklist hydrate in.
    const timer = window.setTimeout(() => {
      const found = loadRecords().find((r) => r.id === id) ?? null;
      setRecord(found);
      if (found) {
        const s = summarizeDocument(found.content, found.type);
        setChecked(loadChecklist(found.id, s.followUps.length));
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  const summary = useMemo(
    () => (record ? summarizeDocument(record.content, record.type) : null),
    [record],
  );

  function toggleChecklist(index: number) {
    if (!record) return;
    const next = checked.map((v, i) => (i === index ? !v : v));
    setChecked(next);
    saveChecklist(record.id, next);
  }

  function ask(q: string) {
    if (!record) return;
    setQuestion(q);
    setAnswer(answerQuestion(record.content, q));
  }

  if (!loaded) return <p className="text-slate-500">Loading record…</p>;

  if (!record || !summary) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
        <h1 className="mt-3 text-xl font-bold">Record not found</h1>
        <p className="mt-1 text-sm text-slate-500">
          This record may have been deleted, or the link is wrong.
        </p>
        <Link href="/" className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
          Back to My Records
        </Link>
      </div>
    );
  }

  const doneCount = checked.filter(Boolean).length;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to My Records
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {record.type}
            </span>
            {record.isSample && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                SAMPLE — fictional data
              </span>
            )}
            <h1 className="mt-2 text-2xl font-bold">{record.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Added {new Date(record.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadText(`${record.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-summary.md`, summaryToMarkdown(record, summary), "text/markdown")}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Download className="h-4 w-4" aria-hidden /> Export summary (.md)
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { deleteRecord(record.id); router.push("/"); }}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirm delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Delete
              </button>
            )}
          </div>
        </div>
      </section>

      <section aria-label="AI summary" className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-teal-600" aria-hidden /> AI Summary
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
            Rule-based — not a diagnosis
          </span>
        </h2>
        <div className="mt-3 space-y-2">
          {summary.summary.map((s, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-700">{s}</p>
          ))}
        </div>

        <h3 className="mt-5 font-semibold">Key findings</h3>
        {summary.keyFindings.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {summary.keyFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No key findings were extracted from this document.</p>
        )}

        {summary.labs.length > 0 && (
          <>
            <h3 className="mt-5 font-semibold">Lab values</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-96 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th scope="col" className="py-2 pr-3 font-medium">Test</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Value</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Reference range</th>
                    <th scope="col" className="py-2 font-medium">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.labs.map((lab) => (
                    <tr key={lab.name} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">{lab.name}</td>
                      <td className="py-2 pr-3">{lab.value} {lab.unit}</td>
                      <td className="py-2 pr-3">
                        {lab.refLow !== null && lab.refHigh !== null
                          ? `${lab.refLow}–${lab.refHigh} ${lab.unit}`
                          : lab.refHigh !== null
                            ? `below ${lab.refHigh} ${lab.unit}`
                            : "—"}
                      </td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${lab.flag === "high" || lab.flag === "low" ? "bg-red-100 text-red-800" : lab.flag === "normal" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                          {lab.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h3 className="mt-5 flex items-center gap-2 font-semibold">
          <ListChecks className="h-4 w-4 text-teal-600" aria-hidden />
          Follow-up checklist ({doneCount} of {summary.followUps.length} done)
        </h3>
        <ul className="mt-2 space-y-2">
          {summary.followUps.map((item, i) => (
            <li key={i}>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={checked[i] ?? false}
                  onChange={() => toggleChecklist(i)}
                  className="mt-0.5 h-4 w-4 accent-teal-600"
                />
                <span className={checked[i] ? "line-through text-slate-400" : ""}>{item}</span>
              </label>
            </li>
          ))}
        </ul>

        <h3 className="mt-5 flex items-center gap-2 font-semibold">
          <HelpCircle className="h-4 w-4 text-teal-600" aria-hidden />
          Questions to ask your doctor
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {summary.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Ask a question" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <MessageCircleQuestion className="h-5 w-5 text-teal-600" aria-hidden /> Ask a question about this document
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Answers come only from the text of this document, with quoted excerpts so you can check them.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-50"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); ask(question); }}
        >
          <label htmlFor="question" className="sr-only">Your question</label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What medications am I taking?"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
            Ask
          </button>
        </form>
        {answer && (
          <div className={`mt-4 rounded-xl border p-4 ${answer.found ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
            <p className="text-sm leading-relaxed">{answer.answer}</p>
            {answer.citations.length > 0 && (
              <div className="mt-3 space-y-1">
                {answer.citations.map((c, i) => (
                  <p key={i} className="text-xs text-slate-600">
                    <span className="font-semibold">Line {c.line}:</span> “{c.text}”
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-label="Full document text" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold">Full document text</h2>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-700">
          {record.content}
        </pre>
      </section>
    </div>
  );
}
