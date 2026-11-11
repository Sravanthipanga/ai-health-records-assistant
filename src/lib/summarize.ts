import type { LabValue, Medication, Summary } from "@/types";

/**
 * Rule-based summarizer — deterministic, offline, no LLM.
 *
 * It extracts structure that is literally present in the document text:
 * dates, medication names + dosages, lab values + reference ranges,
 * diagnoses/conditions, and follow-up instructions. Nothing is invented:
 * if a value is not in the text, it is not in the summary.
 */

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

const KNOWN_MEDS = [
  "amoxicillin",
  "albuterol",
  "metformin",
  "lisinopril",
  "atorvastatin",
  "levothyroxine",
  "omeprazole",
  "amlodipine",
  "ibuprofen",
  "acetaminophen",
  "prednisone",
  "insulin",
  "azithromycin",
  "cephalexin",
  "losartan",
  "hydrochlorothiazide",
  "gabapentin",
  "sertraline",
  "warfarin",
  "furosemide",
];

const KNOWN_CONDITIONS = [
  "pneumonia",
  "diabetes",
  "hypertension",
  "asthma",
  "hyperlipidemia",
  "hypothyroidism",
  "anemia",
  "kidney disease",
  "heart failure",
  "copd",
  "dehydration",
  "bronchitis",
  "influenza",
  "high cholesterol",
  "high blood pressure",
];

const KNOWN_LABS = [
  "hemoglobin",
  "white blood cell count",
  "wbc",
  "platelets",
  "glucose",
  "potassium",
  "sodium",
  "total cholesterol",
  "ldl cholesterol",
  "hdl cholesterol",
  "triglycerides",
  "creatinine",
  "bun",
  "calcium",
  "a1c",
  "hemoglobin a1c",
  "alt",
  "ast",
  "tsh",
  "vitamin d",
];

const LAB_UNITS = [
  "g/dl",
  "mg/dl",
  "mmol/l",
  "meq/l",
  "u/l",
  "ng/ml",
  "pg/ml",
  "x10^9/l",
  "x10^3/ul",
  "fl",
  "ml/min",
  "%",
];

const MED_STOP_WORDS = new Set([
  "hemoglobin",
  "glucose",
  "cholesterol",
  "potassium",
  "sodium",
  "platelets",
  "reference",
  "desirable",
  "total",
  "blood",
  "white",
  "complete",
  "laboratory",
  "patient",
  "sample",
]);

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 1);
}

export function extractDates(text: string): string[] {
  const found: string[] = [];
  const patterns = [
    new RegExp(`\\b(?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4}\\b`, "g"),
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      if (!found.includes(m[0])) found.push(m[0]);
    }
  }
  return found;
}

export function extractMedications(text: string): Medication[] {
  const meds: Medication[] = [];
  const seen = new Set<string>();
  const lines = text.split("\n");
  const freqRe =
    /\b(once daily|twice daily|three times daily|four times daily|every \d+ hours|as needed|before meals|after meals|at bedtime|daily|weekly|for \d+ days?)\b/i;
  for (const rawLine of lines) {
    const line = rawLine.replace(/^[-•\s]+/, "").trim();
    if (!line) continue;
    const re =
      /([A-Z][a-z]+)(?: inhaler)?\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|mL|IU|units|%))\b/g;
    for (const m of line.matchAll(re)) {
      const name = (m[1] ?? "").trim();
      const dosage = (m[2] ?? "").trim();
      const key = `${name.toLowerCase()} ${dosage.toLowerCase()}`;
      if (seen.has(key)) continue;
      const lowerName = name.toLowerCase();
      const isKnown = KNOWN_MEDS.includes(lowerName) || KNOWN_MEDS.some((k) => lowerName.includes(k));
      const looksLikeLab = KNOWN_LABS.some((l) => lowerName === l || lowerName.includes(l));
      if (MED_STOP_WORDS.has(lowerName) || looksLikeLab) continue;
      // Generic capture: only accept if the drug is known, or the line
      // reads like a medication instruction (frequency / "for N days").
      if (!isKnown && !freqRe.test(line)) continue;
      seen.add(key);
      const freq = line.match(freqRe);
      meds.push({ name, dosage, frequency: freq ? freq[0] : null, line });
    }
  }
  return meds;
}

export function extractLabs(text: string): LabValue[] {
  const labs: LabValue[] = [];
  const seen = new Set<string>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    // Name (before the value), value, unit, optional reference range.
    const m = line.match(
      /^([^:()]+?)(?:\s*\([^)]*\))?\s*:?\s+(\d+(?:\.\d+)?)\s*([A-Za-z\/%^0-9·×]+)?/,
    );
    if (!m) continue;
    const name = (m[1] ?? "").trim().replace(/\s+/g, " ");
    const value = parseFloat(m[2] ?? "NaN");
    const unit = (m[3] ?? "").trim();
    if (Number.isNaN(value) || !name || name.length > 40) continue;
    const lowerName = name.toLowerCase();
    const isKnownLab = KNOWN_LABS.some(
      (l) => lowerName === l || lowerName.includes(l) || l.includes(lowerName),
    );
    const isLabUnit = LAB_UNITS.some((u) => unit.toLowerCase() === u);
    if (!isKnownLab && !isLabUnit) continue;
    // Skip medication-style lines (e.g. "Amoxicillin 500 mg ...").
    if (KNOWN_MEDS.includes(lowerName)) continue;

    let refLow: number | null = null;
    let refHigh: number | null = null;
    const range = line.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
    // The first number in the line is the value itself; a range is a
    // second pair of numbers later in the line.
    if (range) {
      const idx = line.indexOf(range[0], line.indexOf(String(m[2] ?? "")) + 1);
      if (idx > 0) {
        refLow = parseFloat(range[1] ?? "NaN");
        refHigh = parseFloat(range[2] ?? "NaN");
      }
    }
    if (refLow === null) {
      const lt = line.match(/less than\s+(\d+(?:\.\d+)?)/i);
      if (lt) refHigh = parseFloat(lt[1] ?? "NaN");
    }
    let flag: LabValue["flag"] = "unknown";
    if (refLow !== null && value < refLow) flag = "low";
    else if (refHigh !== null && value > refHigh) flag = "high";
    else if (refLow !== null || refHigh !== null) flag = "normal";

    const key = lowerName;
    if (seen.has(key)) continue;
    seen.add(key);
    labs.push({ name, value, unit, refLow, refHigh, flag, line });
  }
  return labs;
}

export function extractDiagnoses(text: string): string[] {
  const found: string[] = [];
  const add = (raw: string) => {
    const clean = raw.trim().replace(/[.]+$/, "");
    if (clean && clean.length > 2 && !found.some((f) => f.toLowerCase() === clean.toLowerCase())) {
      found.push(clean);
    }
  };
  const label = text.match(/Diagnos(?:is|es):\s*([^\n]+)/i);
  if (label?.[1]) {
    for (const part of label[1].split(/[,;]|\s+and\s+/)) add(part);
  }
  const secondary = text.match(/Secondary diagnosis:\s*([^\n]+)/i);
  if (secondary?.[1]) add(secondary[1]);
  const lower = text.toLowerCase();
  for (const cond of KNOWN_CONDITIONS) {
    if (lower.includes(cond)) {
      const pretty = cond.replace(/\b\w/g, (c) => c.toUpperCase());
      add(pretty);
    }
  }
  const diagnosed = text.match(/diagnosed with\s+([a-z][a-z ]+?)(?:[.,\n]|$)/i);
  if (diagnosed?.[1]) add(diagnosed[1].trim());
  return found;
}

export function extractFollowUps(text: string): string[] {
  const keywords =
    /follow[- ]?up|appointment|return to|see your|schedule|repeat|contact|call your|visit your|bring this/i;
  const items: string[] = [];
  for (const sentence of splitSentences(text)) {
    if (!keywords.test(sentence)) continue;
    const clean = sentence.replace(/^(Follow-up instructions:|Follow-up:|Notes:)\s*/i, "").trim();
    if (clean.length > 8 && !items.includes(clean)) items.push(clean);
  }
  return items;
}

export function summarizeDocument(text: string, type: string): Summary {
  const medications = extractMedications(text);
  const labs = extractLabs(text);
  const diagnoses = extractDiagnoses(text);
  const dates = extractDates(text);
  const followUps = extractFollowUps(text);
  const sentences = splitSentences(text);

  const summary: string[] = [];
  const typeLabel = type.toLowerCase();
  const firstDate = dates[0];
  summary.push(
    `This is a ${typeLabel}${firstDate ? ` dated ${firstDate}` : ""}.` +
      (diagnoses.length > 0
        ? ` It mentions ${diagnoses.join(", ")}.`
        : ""),
  );
  if (medications.length > 0) {
    const list = medications
      .map((m) => `${m.name} ${m.dosage}${m.frequency ? ` (${m.frequency})` : ""}`)
      .join("; ");
    summary.push(`It lists ${medications.length} medication${medications.length > 1 ? "s" : ""}: ${list}.`);
  }
  if (labs.length > 0) {
    const flagged = labs.filter((l) => l.flag === "high" || l.flag === "low");
    if (flagged.length > 0) {
      summary.push(
        `${flagged.length} lab value${flagged.length > 1 ? "s are" : " is"} outside the reference range: ` +
          flagged.map((l) => `${l.name} ${l.value} ${l.unit} (${l.flag})`).join("; ") +
          ".",
      );
    } else {
      summary.push(`It includes ${labs.length} lab values, all within their stated reference ranges.`);
    }
  }
  if (followUps.length > 0) {
    summary.push(`Follow-up is mentioned: ${followUps[0]}.`);
  }
  if (summary.length < 3) {
    const firstContent = sentences.find((s) => s.length > 40 && !/^(DISCHARGE|LABORATORY|INSURANCE|Patient:|From:|To:)/i.test(s));
    if (firstContent) summary.push(firstContent);
  }
  if (summary.length < 3) {
    summary.push(
      "No medications, lab values, or follow-up instructions were found in the text of this document.",
    );
  }

  const keyFindings: string[] = [];
  for (const d of diagnoses) keyFindings.push(`Diagnosis / condition: ${d}`);
  for (const m of medications) {
    keyFindings.push(
      `Medication: ${m.name} ${m.dosage}${m.frequency ? ` — ${m.frequency}` : ""}`,
    );
  }
  for (const l of labs) {
    const ref =
      l.refLow !== null && l.refHigh !== null
        ? ` (reference ${l.refLow}–${l.refHigh} ${l.unit})`
        : l.refHigh !== null
          ? ` (reference below ${l.refHigh} ${l.unit})`
          : "";
    keyFindings.push(
      `Lab: ${l.name} — ${l.value} ${l.unit}${ref} — ${l.flag === "normal" ? "within range" : l.flag === "unknown" ? "no reference range given" : `flagged ${l.flag}`}`,
    );
  }
  for (const d of dates.slice(0, 4)) keyFindings.push(`Date mentioned: ${d}`);

  const questions: string[] = [];
  for (const l of labs.filter((x) => x.flag === "high" || x.flag === "low")) {
    questions.push(`Why is my ${l.name} ${l.flag} (${l.value} ${l.unit}) and should I be concerned?`);
  }
  for (const m of medications) {
    questions.push(`How long should I take ${m.name} ${m.dosage}, and what should I do if I miss a dose?`);
  }
  if (followUps.length > 0) questions.push("What should I do if my symptoms return before my follow-up?");
  if (diagnoses.length > 0) questions.push(`What does a diagnosis of ${diagnoses[0]} mean for my daily life?`);
  questions.push("Is there anything in this document I should be concerned about?");
  const uniqueQuestions = [...new Set(questions)].slice(0, 5);

  return {
    summary: summary.slice(0, 5),
    keyFindings,
    followUps: followUps.length > 0 ? followUps : ["Review this summary with your clinician."],
    questions: uniqueQuestions,
    medications,
    labs,
    diagnoses,
    dates,
  };
}
