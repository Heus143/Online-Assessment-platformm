// Local question generator — simulates AI without an API key.
// Generates 5 MCQs, 3 True/False, 3 Short Answer questions from the syllabus.

export interface MCQ {
  question: string;
  options: string[];
  answer: string;
}
export interface TFQ {
  question: string;
  answer: boolean;
}
export interface SAQ {
  question: string;
  hint: string;
}
export interface GeneratedQuestions {
  mcqs: MCQ[];
  trueFalse: TFQ[];
  shortAnswers: SAQ[];
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
  "is","are","was","were","be","been","being","have","has","had","do","does",
  "did","will","would","could","should","may","might","must","this","that",
  "these","those","it","its","as","from","into","about","over","under","than","then",
]);

function extractKeyTerms(text: string, limit = 20): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const freq = new Map<string, number>();
  words.forEach((w) => freq.set(w, (freq.get(w) || 0) + 1));
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

function extractSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length > 4);
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateQuestions(syllabus: string): GeneratedQuestions {
  const terms = extractKeyTerms(syllabus);
  const sentences = extractSentences(syllabus);
  const safe = (i: number, fallback: string) => terms[i] || fallback;

  const mcqTemplates = [
    (t: string) => `Which of the following best defines "${t}"?`,
    (t: string) => `What is the primary purpose of ${t}?`,
    (t: string) => `Which statement about ${t} is most accurate?`,
    (t: string) => `${t} is most closely associated with which concept?`,
    (t: string) => `In the context of the syllabus, ${t} refers to:`,
  ];

  const mcqs: MCQ[] = mcqTemplates.map((tpl, i) => {
    const term = safe(i, "the topic");
    const correct = `A core concept involving ${term.toLowerCase()}`;
    const distractors = [
      `An unrelated process in ${safe(i + 5, "another field")}`,
      `A deprecated method no longer in use`,
      `A type of ${safe(i + 7, "external system")}`,
    ];
    const options = shuffle([correct, ...distractors]);
    return { question: tpl(term), options, answer: correct };
  });

  const tfTemplates = [
    (t: string) => ({ q: `${t} is a fundamental topic covered in this syllabus.`, a: true }),
    (t: string) => ({ q: `${t} has no relevance to the subject matter discussed.`, a: false }),
    (t: string) => ({ q: `Understanding ${t} is essential for mastering the material.`, a: true }),
  ];

  const trueFalse: TFQ[] = tfTemplates.map((tpl, i) => {
    const { q, a } = tpl(safe(i, "this concept").toLowerCase());
    return { question: q.charAt(0).toUpperCase() + q.slice(1), answer: a };
  });

  const saqTemplates = [
    (t: string) => ({ q: `Define ${t} in your own words.`, h: `Focus on what ${t} is and why it matters.` }),
    (t: string) => ({ q: `Explain the significance of ${t} in this subject.`, h: `Connect ${t} to other key topics.` }),
    (t: string) => ({ q: `Provide an example that illustrates ${t}.`, h: `Use a real-world or practical example.` }),
  ];

  const shortAnswers: SAQ[] = saqTemplates.map((tpl, i) => {
    const t = safe(i, pick(sentences, i)?.split(" ").slice(0, 3).join(" ") || "the concept");
    const { q, h } = tpl(t.toLowerCase());
    return { question: q.charAt(0).toUpperCase() + q.slice(1), hint: h };
  });

  return { mcqs, trueFalse, shortAnswers };
}