import { describe, expect, it } from "vitest";
import { answerQuestion } from "@/lib/qa";
import { SAMPLE_RECORDS } from "@/lib/seed";

const discharge = SAMPLE_RECORDS[0]?.content ?? "";
const lab = SAMPLE_RECORDS[1]?.content ?? "";
const insurance = SAMPLE_RECORDS[2]?.content ?? "";

describe("Q&A", () => {
  it("answers what medications the patient is taking, with citations", () => {
    const a = answerQuestion(discharge, "What medications am I taking?");
    expect(a.found).toBe(true);
    expect(a.answer).toMatch(/Amoxicillin/);
    expect(a.citations.length).toBeGreaterThan(0);
    expect(a.citations[0]?.text).toMatch(/Amoxicillin/);
  });

  it("answers what the lab results were, with line citations", () => {
    const a = answerQuestion(lab, "What were my lab results?");
    expect(a.found).toBe(true);
    expect(a.answer).toMatch(/Hemoglobin/);
    expect(a.citations.every((c) => c.line >= 1)).toBe(true);
  });

  it("answers when the follow-up is", () => {
    const a = answerQuestion(discharge, "When is my follow-up?");
    expect(a.found).toBe(true);
    expect(a.answer).toMatch(/November 9, 2026/);
  });

  it("answers the diagnosis question", () => {
    const a = answerQuestion(discharge, "What is my diagnosis?");
    expect(a.found).toBe(true);
    expect(a.answer).toMatch(/pneumonia/i);
  });

  it("answers insurance approval questions from the letter", () => {
    const a = answerQuestion(insurance, "Was my prior authorization approved?");
    expect(a.found).toBe(true);
    expect(a.answer).toMatch(/approved/i);
  });

  it("says 'Not found in this document' for absent information", () => {
    const a = answerQuestion(discharge, "What is my blood type?");
    expect(a.found).toBe(false);
    expect(a.answer).toMatch(/Not found in this document/);
    expect(a.citations).toEqual([]);
  });

  it("handles an empty question", () => {
    const a = answerQuestion(discharge, "   ");
    expect(a.found).toBe(false);
  });
});
