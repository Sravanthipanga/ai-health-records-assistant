import type { QaAnswer } from "@/types";

/**
 * Rule-based Q&A — keyword / retrieval over the document text.
 * Answers are grounded in the document: every answer quotes the exact
 * lines it came from. If nothing relevant is in the text, it says so.
 */

const STOPWORDS = new Set([
  "what", "when", "where", "which", "who", "how", "why", "is", "are", "was",
  "were", "do", "does", "did", "am", "i", "my", "me", "the", "a", "an",
  "and", "or", "of", "to", "in", "on", "for", "with", "should", "can",
  "could", "would", "please", "tell", "about", "there", "any", "it", "its",
  "this", "that", "have", "has", "been", "by", "at", "from", "as",
]);

function linesOf(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3 && !STOPWORDS.has(t));
}

function scoreLine(questionTokens: string[], line: string): number {
  const lower = line.toLowerCase();
  let score = 0;
  for (const tok of questionTokens) {
    if (lower.includes(tok)) score += 1;
    // crude stemming: "medication" vs "medications"
    if (lower.includes(tok.replace(/s$/, "")) && tok.endsWith("s")) score += 0.5;
  }
  return score;
}

function notFound(question: string): QaAnswer {
  return {
    found: false,
    answer: `Not found in this document — I could not find anything about "${question.trim()}" in the text of this record.`,
    citations: [],
  };
}

export function answerQuestion(documentText: string, question: string): QaAnswer {
  const q = question.trim();
  if (!q) {
    return { found: false, answer: "Please type a question about this document.", citations: [] };
  }
  const lines = linesOf(documentText);
  const lowerQ = q.toLowerCase();
  const qTokens = tokens(q);

  const pick = (matches: { line: number; text: string }[], intro: string): QaAnswer => {
    if (matches.length === 0) return notFound(q);
    return {
      found: true,
      answer: `${intro} ${matches.map((m) => `"${m.text}"`).join(" ")}`,
      citations: matches.slice(0, 4),
    };
  };

  const cited = (predicate: (line: string) => boolean) =>
    lines
      .map((text, i) => ({ line: i + 1, text }))
      .filter((entry) => predicate(entry.text));

  // Intent: medications
  if (/\b(medication|medicine|drug|pill|dose|prescri|taking|take)\b/.test(lowerQ)) {
    const medLines = cited((l) =>
      /\b(mg|mcg|g|mL|IU|units)\b/.test(l) &&
      /(amoxicillin|albuterol|metformin|lisinopril|atorvastatin|levothyroxine|omeprazole|amlodipine|ibuprofen|acetaminophen|prednisone|insulin|azithromycin|cephalexin|losartan|gabapentin|sertraline|warfarin|furosemide|hydrochlorothiazide)/i.test(l),
    );
    const fallback = medLines.length > 0 ? medLines : cited((l) => /medication/i.test(l));
    return pick(fallback, "Based on this document, the medications listed are:");
  }

  // Intent: lab results
  if (/\b(lab|result|blood|hemoglobin|glucose|cholesterol|potassium|sodium|platelet|wbc|test result)\b/.test(lowerQ)) {
    const labLines = cited((l) =>
      /:\s*\d+(?:\.\d+)?\s*(g\/dL|mg\/dL|mmol\/L|x10\^9\/L|%)/.test(l) ||
      /reference/i.test(l),
    );
    return pick(labLines, "The lab results in this document are:");
  }

  // Intent: follow-up / when
  if (/\b(follow[- ]?up|appointment|when|next visit|see (the |my |your )?doctor|return)\b/.test(lowerQ)) {
    const fuLines = cited((l) =>
      /follow[- ]?up|appointment|return to|see your|in \d+ days|in \d+ weeks|November|December|January|October/i.test(l),
    );
    return pick(fuLines, "The follow-up information in this document is:");
  }

  // Intent: diagnosis / condition
  if (/\b(diagnos|condition|disease|illness|wrong|sick|suffering)\b/.test(lowerQ)) {
    const dLines = cited((l) => /diagnos|condition/i.test(l));
    return pick(dLines, "This document states:");
  }

  // Intent: insurance / coverage / approval
  if (/\b(insuranc|cover|approv|authoriz|copay|appeal|claim)\b/.test(lowerQ)) {
    const iLines = cited((l) => /approv|coverage|copay|appeal|authoriz/i.test(l));
    return pick(iLines, "This document states:");
  }

  // Generic retrieval: best-matching lines by token overlap.
  const scored = lines
    .map((text, i) => ({ line: i + 1, text, score: scoreLine(qTokens, text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return notFound(q);
  const top = scored.slice(0, 3);
  return {
    found: true,
    answer: `From this document: ${top.map((m) => `"${m.text}"`).join(" ")}`,
    citations: top.map(({ line, text }) => ({ line, text })),
  };
}
