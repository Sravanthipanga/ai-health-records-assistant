import { z } from "zod";

/**
 * FHIR R4 validation with Zod. Unknown extra fields are allowed
 * (loose objects) so real-world bundles are not rejected for
 * extensions we do not model.
 */

const codeableConcept = z.looseObject({
  text: z.string().optional(),
  coding: z
    .array(z.looseObject({ system: z.string().optional(), code: z.string().optional(), display: z.string().optional() }))
    .optional(),
});

const reference = z.looseObject({
  reference: z.string().optional(),
  display: z.string().optional(),
});

const patientSchema = z.looseObject({
  resourceType: z.literal("Patient"),
  id: z.string().optional(),
  name: z.array(z.looseObject({ family: z.string().optional(), given: z.array(z.string()).optional(), text: z.string().optional() })).optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
});

const observationSchema = z.looseObject({
  resourceType: z.literal("Observation"),
  id: z.string().optional(),
  status: z.string().optional(),
  code: codeableConcept.optional(),
  subject: reference.optional(),
  effectiveDateTime: z.string().optional(),
  issued: z.string().optional(),
  valueQuantity: z.looseObject({ value: z.number().optional(), unit: z.string().optional() }).optional(),
  valueString: z.string().optional(),
  interpretation: z.array(codeableConcept).optional(),
});

const conditionSchema = z.looseObject({
  resourceType: z.literal("Condition"),
  id: z.string().optional(),
  code: codeableConcept.optional(),
  subject: reference.optional(),
  onsetDateTime: z.string().optional(),
  recordedDate: z.string().optional(),
  clinicalStatus: codeableConcept.optional(),
});

const medicationRequestSchema = z.looseObject({
  resourceType: z.literal("MedicationRequest"),
  id: z.string().optional(),
  status: z.string().optional(),
  medicationCodeableConcept: codeableConcept.optional(),
  subject: reference.optional(),
  authoredOn: z.string().optional(),
  dosageInstruction: z.array(z.looseObject({ text: z.string().optional() })).optional(),
});

const encounterSchema = z.looseObject({
  resourceType: z.literal("Encounter"),
  id: z.string().optional(),
  status: z.string().optional(),
  class: z.looseObject({ code: z.string().optional(), display: z.string().optional() }).optional(),
  subject: reference.optional(),
  period: z.looseObject({ start: z.string().optional(), end: z.string().optional() }).optional(),
});

export const fhirResourceSchema = z.discriminatedUnion("resourceType", [
  patientSchema,
  observationSchema,
  conditionSchema,
  medicationRequestSchema,
  encounterSchema,
]);

export type FhirResource = z.infer<typeof fhirResourceSchema>;

export const fhirBundleSchema = z.looseObject({
  resourceType: z.literal("Bundle"),
  type: z.string(),
  entry: z.array(z.looseObject({ resource: fhirResourceSchema })).min(1, "Bundle must contain at least one entry."),
});

export type FhirBundle = z.infer<typeof fhirBundleSchema>;

export interface FhirParseResult {
  ok: boolean;
  bundle: FhirBundle | null;
  error: string | null;
}

export function parseFhirBundle(input: string): FhirParseResult {
  if (!input.trim()) {
    return { ok: false, bundle: null, error: "Paste a FHIR Bundle JSON to view it." };
  }
  let json: unknown;
  try {
    json = JSON.parse(input);
  } catch {
    return { ok: false, bundle: null, error: "Invalid JSON — please check the pasted text and try again." };
  }
  const result = fhirBundleSchema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      ok: false,
      bundle: null,
      error: first ? `FHIR validation failed: ${first.path.join(".") || "bundle"} — ${first.message}` : "FHIR validation failed.",
    };
  }
  return { ok: true, bundle: result.data, error: null };
}

export interface TimelineEntry {
  date: string;
  type: string;
  title: string;
  detail: string;
}

function displayOf(concept: { text?: string; coding?: { display?: string; code?: string }[] } | undefined): string {
  if (!concept) return "";
  if (concept.text) return concept.text;
  const first = concept.coding?.[0];
  return first?.display ?? first?.code ?? "";
}

export function bundleToTimeline(bundle: FhirBundle): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (const entry of bundle.entry) {
    const r = entry.resource;
    if (r.resourceType === "Patient") {
      const name = r.name?.[0];
      const full = name?.text ?? [...(name?.given ?? []), name?.family ?? ""].filter(Boolean).join(" ");
      entries.push({
        date: r.birthDate ?? "",
        type: "Patient",
        title: full || "Patient",
        detail: [r.gender ? `Gender: ${r.gender}` : "", r.birthDate ? `Born: ${r.birthDate}` : ""].filter(Boolean).join(" · "),
      });
    } else if (r.resourceType === "Observation") {
      const value = r.valueQuantity
        ? `${r.valueQuantity.value ?? ""} ${r.valueQuantity.unit ?? ""}`.trim()
        : (r.valueString ?? "");
      entries.push({
        date: r.effectiveDateTime ?? r.issued ?? "",
        type: "Observation",
        title: displayOf(r.code) || "Observation",
        detail: [value, r.status ? `Status: ${r.status}` : ""].filter(Boolean).join(" · "),
      });
    } else if (r.resourceType === "Condition") {
      entries.push({
        date: r.onsetDateTime ?? r.recordedDate ?? "",
        type: "Condition",
        title: displayOf(r.code) || "Condition",
        detail: displayOf(r.clinicalStatus) ? `Status: ${displayOf(r.clinicalStatus)}` : "",
      });
    } else if (r.resourceType === "MedicationRequest") {
      entries.push({
        date: r.authoredOn ?? "",
        type: "MedicationRequest",
        title: displayOf(r.medicationCodeableConcept) || "Medication",
        detail: [r.dosageInstruction?.[0]?.text ?? "", r.status ? `Status: ${r.status}` : ""].filter(Boolean).join(" · "),
      });
    } else if (r.resourceType === "Encounter") {
      entries.push({
        date: r.period?.start ?? "",
        type: "Encounter",
        title: r.class?.display ?? r.class?.code ?? "Encounter",
        detail: [r.status ? `Status: ${r.status}` : "", r.period?.end ? `Ended: ${r.period.end}` : ""].filter(Boolean).join(" · "),
      });
    }
  }
  entries.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
  return entries;
}
