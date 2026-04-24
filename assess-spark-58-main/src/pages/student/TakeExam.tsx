import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Camera, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  id: string;
  question_type: "mcq" | "true_false";
  prompt: string;
  options: string[];
  correct_answer: string;
  position: number;
}

const TakeExam = () => {
  const { id: examId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState(0);
  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Load exam, questions, attempt
  useEffect(() => {
    if (!examId || !user) return;
    (async () => {
      const [{ data: e }, { data: qs }, { data: att }] = await Promise.all([
        supabase.from("exams").select("*").eq("id", examId).maybeSingle(),
        supabase.from("exam_questions").select("*").eq("exam_id", examId).order("position"),
        supabase.from("exam_attempts").select("*").eq("exam_id", examId).eq("student_id", user.id).maybeSingle(),
      ]);
      if (att?.status === "submitted") {
        navigate(`/student/exams/${examId}/result`, { replace: true });
        return;
      }
      setExam(e);
      setQuestions((qs ?? []) as Question[]);
      setAttemptId(att?.id ?? null);
      setWarnings(att?.warning_count ?? 0);
      setAnswers((att?.answers as any) ?? {});
      const startedAt = att?.started_at ? new Date(att.started_at).getTime() : Date.now();
      const deadline = startedAt + (e?.duration_minutes ?? 30) * 60_000;
      setSecondsLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)));
      setLoading(false);
    })();
  }, [examId, user, navigate]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (!attemptId || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) score++;
    });
    const cheating = warnings >= 2 ? "Suspected Cheating" : "Genuine Attempt";
    await supabase.from("exam_attempts").update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      score,
      total_questions: questions.length,
      warning_count: warnings,
      cheating_status: cheating,
      answers,
    }).eq("id", attemptId);
    toast.success(auto ? "Time's up — auto-submitted" : "Exam submitted!", {
      description: `Score: ${score}/${questions.length}`,
    });
    navigate(`/student/exams/${examId}/result`, { replace: true });
  }, [attemptId, answers, questions, warnings, examId, navigate]);

  // Timer
  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, handleSubmit]);

  // Tab switch detection
  useEffect(() => {
    if (loading || !attemptId) return;
    const onHidden = async () => {
      if (document.hidden && !submittedRef.current) {
        const newCount = warnings + 1;
        setWarnings(newCount);
        setWarningOpen(true);
        await supabase.from("attempt_events").insert({
          attempt_id: attemptId,
          event_type: "tab_switch",
          message: "Student left the exam tab.",
        });
        await supabase.from("exam_attempts").update({ warning_count: newCount }).eq("id", attemptId);
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, [loading, attemptId, warnings]);

  // Auto-save answers
  useEffect(() => {
    if (!attemptId || loading) return;
    const t = setTimeout(() => {
      supabase.from("exam_attempts").update({ answers }).eq("id", attemptId);
    }, 600);
    return () => clearTimeout(t);
  }, [answers, attemptId, loading]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Locked top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div>
            <p className="font-display text-sm font-bold">{exam?.name}</p>
            <p className="text-xs text-muted-foreground">{answeredCount}/{questions.length} answered</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <Camera className="h-3 w-3" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Camera ON
            </span>
            {warnings > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">
                <AlertTriangle className="h-3 w-3" /> {warnings} warning{warnings > 1 ? "s" : ""}
              </span>
            )}
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-sm font-bold ${secondsLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"}`}>
              <Clock className="h-4 w-4" /> {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        <Progress value={(answeredCount / Math.max(questions.length, 1)) * 100} className="h-1 rounded-none" />
      </header>

      <main className="container py-8">
        <div className="mx-auto max-w-3xl space-y-5">
          {questions.map((q, i) => (
            <Card key={q.id} className="border-border/60 shadow-soft">
              <CardContent className="p-6">
                <p className="mb-4 font-medium">
                  <span className="text-primary">Q{i + 1}.</span> {q.prompt}
                </p>
                <RadioGroup
                  value={answers[q.id] ?? ""}
                  onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                >
                  {q.options.map((opt, j) => (
                    <div key={j} className="flex items-center space-x-2 rounded-lg border border-border/60 p-3 transition hover:bg-secondary/40">
                      <RadioGroupItem value={opt} id={`${q.id}-${j}`} />
                      <Label htmlFor={`${q.id}-${j}`} className="flex-1 cursor-pointer text-sm font-normal">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          ))}

          <Button variant="hero" size="lg" className="w-full" onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : "Submit exam"}
          </Button>
        </div>
      </main>

      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" /> Tab switch detected!
            </AlertDialogTitle>
            <AlertDialogDescription>
              You left the exam window. This counts as a warning. Two or more warnings will mark your attempt as <strong>Suspected Cheating</strong>.
              <div className="mt-3 rounded-lg bg-warning/10 px-3 py-2 font-semibold text-warning">
                Warnings: {warnings}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>I understand</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TakeExam;