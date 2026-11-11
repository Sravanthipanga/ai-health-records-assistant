import { describe, expect, it } from "vitest";
import { bundleToTimeline, parseFhirBundle } from "@/lib/fhir";
import { SAMPLE_FHIR_BUNDLE } from "@/lib/sampleFhir";

describe("FHIR parsing", () => {
  it("parses the sample bundle and counts its resources", () => {
    const result = parseFhirBundle(SAMPLE_FHIR_BUNDLE);
    expect(result.ok).toBe(true);
    expect(result.bundle?.entry.length).toBe(6);
    expect(result.bundle?.entry.map((e) => e.resource.resourceType)).toContain("Patient");
    expect(result.bundle?.entry.map((e) => e.resource.resourceType)).toContain("Observation");
    expect(result.bundle?.entry.map((e) => e.resource.resourceType)).toContain("MedicationRequest");
  });

  it("builds a timeline sorted by date", () => {
    const result = parseFhirBundle(SAMPLE_FHIR_BUNDLE);
    expect(result.bundle).not.toBeNull();
    if (!result.bundle) return;
    const timeline = bundleToTimeline(result.bundle);
    expect(timeline.length).toBe(6);
    expect(timeline.map((t) => t.type)).toContain("Condition");
    expect(timeline.map((t) => t.title).join(" ")).toMatch(/Hemoglobin/);
    const dated = timeline.filter((t) => t.date);
    const dates = dated.map((t) => t.date);
    expect(dates).toEqual([...dates].sort());
  });

  it("rejects invalid JSON with a clear error", () => {
    const result = parseFhirBundle("{not json");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid JSON/);
  });

  it("rejects a non-Bundle resource", () => {
    const result = parseFhirBundle(JSON.stringify({ resourceType: "Patient", id: "x" }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/FHIR validation failed/);
  });

  it("rejects an empty bundle", () => {
    const result = parseFhirBundle(JSON.stringify({ resourceType: "Bundle", type: "collection", entry: [] }));
    expect(result.ok).toBe(false);
  });

  it("rejects an empty input", () => {
    const result = parseFhirBundle("   ");
    expect(result.ok).toBe(false);
  });
});
