import { generateQuestions } from "./questionGenerator";

export interface BuiltQuestion {
  question_type: "mcq" | "true_false";
  prompt: string;
  options: string[];
  correct_answer: string;
  position: number;
}

/** Convert simulated generator output into auto-gradable DB rows (MCQ + T/F only) */
export function buildQuestionsFromSyllabus(syllabus: string): BuiltQuestion[] {
  const { mcqs, trueFalse } = generateQuestions(syllabus);
  const rows: BuiltQuestion[] = [];
  let i = 0;
  for (const m of mcqs) {
    rows.push({
      question_type: "mcq",
      prompt: m.question,
      options: m.options,
      correct_answer: m.answer,
      position: i++,
    });
  }
  for (const tf of trueFalse) {
    rows.push({
      question_type: "true_false",
      prompt: tf.question,
      options: ["True", "False"],
      correct_answer: tf.answer ? "True" : "False",
      position: i++,
    });
  }
  return rows;
}