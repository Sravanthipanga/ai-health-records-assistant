import { describe, expect, it } from "vitest";
import {
  extractDates,
  extractDiagnoses,
  extractFollowUps,
  extractLabs,
  extractMedications,
  summarizeDocument,
} from "@/lib/summarize";
import { SAMPLE_RECORDS } from "@/lib/seed";

const discharge = SAMPLE_RECORDS[0]?.content ?? "";
const lab = SAMPLE_RECORDS[1]?.content ?? "";

describe("summarize — medications", () => {
  it("extracts Amoxicillin with dosage and frequency", () => {
    const meds = extractMedications(discharge);
    const amox = meds.find((m) => m.name === "Amoxicillin");
    expect(amox).toBeDefined();
    expect(amox?.dosage).toBe("500 mg");
    expect(amox?.frequency).toMatch(/three times daily/i);
  });

  it("extracts Albuterol with mcg dosage", () => {
    const meds = extractMedications(discharge);
    const alb = meds.find((m) => m.name === "Albuterol");
    expect(alb).toBeDefined();
    expect(alb?.dosage).toBe("90 mcg");
  });

  it("does not treat lab values as medications", () => {
    const meds = extractMedications(lab);
    expect(meds.map((m) => m.name)).not.toContain("Hemoglobin");
    expect(meds.map((m) => m.name)).not.toContain("Glucose");
  });
});

describe("summarize — labs", () => {
  it("flags Hemoglobin as low against its reference range", () => {
    const labs = extractLabs(lab);
    const hgb = labs.find((l) => l.name === "Hemoglobin");
    expect(hgb?.value).toBe(11.8);
    expect(hgb?.unit).toBe("g/dL");
    expect(hgb?.refLow).toBe(12.0);
    expect(hgb?.refHigh).toBe(15.5);
    expect(hgb?.flag).toBe("low");
  });

  it("flags Glucose as high and Potassium as normal", () => {
    const labs = extractLabs(lab);
    expect(labs.find((l) => l.name === "Glucose")?.flag).toBe("high");
    expect(labs.find((l) => l.name === "Potassium")?.flag).toBe("normal");
  });

  it("treats Total Cholesterol below 200 as normal", () => {
    const labs = extractLabs(lab);
    expect(labs.find((l) => l.name === "Total Cholesterol")?.flag).toBe("normal");
  });
});

describe("summarize — diagnoses, dates, follow-ups", () => {
  it("extracts the pneumonia diagnosis", () => {
    expect(extractDiagnoses(discharge).join(" ")).toMatch(/pneumonia/i);
  });

  it("extracts dates mentioned in the document", () => {
    const dates = extractDates(discharge);
    expect(dates).toContain("November 2, 2026");
    expect(dates).toContain("November 9, 2026");
  });

  it("extracts follow-up instructions", () => {
    const followUps = extractFollowUps(discharge);
    expect(followUps.length).toBeGreaterThan(0);
    expect(followUps.join(" ")).toMatch(/primary care/i);
  });

  it("builds a 3–5 sentence plain-English summary with findings and questions", () => {
    const summary = summarizeDocument(discharge, "Discharge Summary");
    expect(summary.summary.length).toBeGreaterThanOrEqual(3);
    expect(summary.summary.length).toBeLessThanOrEqual(5);
    expect(summary.keyFindings.length).toBeGreaterThan(0);
    expect(summary.questions.length).toBeGreaterThan(0);
    expect(summary.followUps.length).toBeGreaterThan(0);
  });
});
