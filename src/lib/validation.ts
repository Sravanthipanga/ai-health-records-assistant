import { z } from "zod";
import type { RecordType } from "@/types";

export const RECORD_TYPES: RecordType[] = [
  "Discharge Summary",
  "Lab Report",
  "Insurance Letter",
  "Other",
];

export const recordInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be 120 characters or fewer."),
  type: z.enum(RECORD_TYPES),
  content: z
    .string()
    .trim()
    .min(1, "Document text is required.")
    .max(200_000, "Document text is too long."),
});

export type RecordInput = z.infer<typeof recordInputSchema>;

export const MAX_FILE_BYTES = 1_048_576; // 1 MB
export const ALLOWED_EXTENSIONS = [".txt", ".md"] as const;

export function validateUploadFile(file: File): string | null {
  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return "Only .txt and .md files are supported.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "File is too large — the maximum size is 1 MB.";
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  return null;
}
