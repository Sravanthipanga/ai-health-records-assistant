import type { HealthRecord } from "@/types";
import { SAMPLE_RECORDS } from "@/lib/seed";

const STORAGE_KEY = "hra-records-v1";
const CHECKLIST_KEY = "hra-checklist-v1";

let memoryRecords: HealthRecord[] | null = null;
let memoryChecklist: Record<string, boolean[]> = {};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadRecords(): HealthRecord[] {
  if (!isBrowser()) return SAMPLE_RECORDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HealthRecord[];
      if (Array.isArray(parsed)) return parsed;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_RECORDS));
    return SAMPLE_RECORDS;
  } catch {
    if (!memoryRecords) memoryRecords = [...SAMPLE_RECORDS];
    return memoryRecords;
  }
}

export function saveRecords(records: HealthRecord[]): void {
  if (!isBrowser()) {
    memoryRecords = records;
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    memoryRecords = records;
  }
}

export function createRecord(
  input: { title: string; type: HealthRecord["type"]; content: string },
  id?: string,
): HealthRecord {
  const record: HealthRecord = {
    id: id ?? `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    type: input.type,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
    isSample: false,
  };
  const records = [record, ...loadRecords()];
  saveRecords(records);
  return record;
}

export function deleteRecord(id: string): HealthRecord[] {
  const records = loadRecords().filter((r) => r.id !== id);
  saveRecords(records);
  return records;
}

export function loadChecklist(docId: string, itemCount: number): boolean[] {
  let map: Record<string, boolean[]> = memoryChecklist;
  if (isBrowser()) {
    try {
      map = JSON.parse(window.localStorage.getItem(CHECKLIST_KEY) ?? "{}") as Record<
        string,
        boolean[]
      >;
    } catch {
      map = memoryChecklist;
    }
  }
  const saved = map[docId];
  if (Array.isArray(saved) && saved.length === itemCount) return saved;
  return Array.from({ length: itemCount }, () => false);
}

export function saveChecklist(docId: string, values: boolean[]): void {
  memoryChecklist = { ...memoryChecklist, [docId]: values };
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(CHECKLIST_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean[]>) : {};
    map[docId] = values;
    window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable — in-memory copy above is the fallback.
  }
}
