import { supabase } from "@/integrations/supabase/client";

export async function uploadSyllabusPdf(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "pdf";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("syllabi").upload(path, file, {
    contentType: file.type || "application/pdf",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Lightweight simulated PDF text extractor — returns a synthetic syllabus */
export function simulatePdfText(file: File, extra: string = ""): string {
  const base = file.name.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ");
  const seedTopics = [
    "introduction", "core principles", "advanced applications",
    "case studies", "evaluation", "best practices", "future trends",
  ];
  const lines = seedTopics.map(
    (t, i) => `Chapter ${i + 1}: ${t} of ${base}. Students will explore key terms, definitions, examples and analytical methods related to ${base}.`
  );
  return [`Syllabus extracted from ${file.name}.`, ...lines, extra].filter(Boolean).join(" ");
}