export type RecordType =
  | "Discharge Summary"
  | "Lab Report"
  | "Insurance Letter"
  | "Other";

export interface HealthRecord {
  id: string;
  title: string;
  type: RecordType;
  content: string;
  createdAt: string;
  isSample: boolean;
}

export interface LabValue {
  name: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  flag: "high" | "low" | "normal" | "unknown";
  line: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string | null;
  line: string;
}

export interface Summary {
  summary: string[];
  keyFindings: string[];
  followUps: string[];
  questions: string[];
  medications: Medication[];
  labs: LabValue[];
  diagnoses: string[];
  dates: string[];
}

export interface QaAnswer {
  found: boolean;
  answer: string;
  citations: { line: number; text: string }[];
}
