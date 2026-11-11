import { describe, expect, it } from "vitest";
import { recordInputSchema, validateUploadFile } from "@/lib/validation";

function fakeFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type: "text/plain" });
}

describe("validation", () => {
  it("accepts a valid record", () => {
    const result = recordInputSchema.safeParse({
      title: "Lab Report",
      type: "Lab Report",
      content: "Hemoglobin: 11.8 g/dL",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = recordInputSchema.safeParse({ title: "  ", type: "Other", content: "text" });
    expect(result.success).toBe(false);
  });

  it("rejects a title over 120 characters", () => {
    const result = recordInputSchema.safeParse({ title: "x".repeat(121), type: "Other", content: "text" });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = recordInputSchema.safeParse({ title: "T", type: "Other", content: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown document type", () => {
    const result = recordInputSchema.safeParse({ title: "T", type: "X-Ray", content: "text" });
    expect(result.success).toBe(false);
  });

  it("accepts a .txt file under 1 MB", () => {
    expect(validateUploadFile(fakeFile("notes.txt", 100))).toBeNull();
  });

  it("rejects a .pdf file", () => {
    expect(validateUploadFile(fakeFile("notes.pdf", 100))).toMatch(/Only \.txt and \.md/);
  });

  it("rejects a file over 1 MB", () => {
    expect(validateUploadFile(fakeFile("big.txt", 1_048_577))).toMatch(/too large/);
  });
});
