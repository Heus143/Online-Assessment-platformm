import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Camera, Clock, FileText, ShieldCheck, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ExamInstructions = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: e } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
      setExam(e);
      const { count } = await supabase
        .from("exam_questions")
        .select("id", { count: "exact", head: true })
        .eq("exam_id", id);
      setQuestionCount(count ?? 0);
    })();
  }, [id]);

  const requestCamera = () => {
    // UI simulation only — never actually requests the camera
    setCameraOn(true);
    toast.success("Camera ready (simulated)", { description: "Your webcam indicator will stay ON during the exam." });
  };

  const startExam = async () => {
    if (!user || !id) return;
    setStarting(true);
    // Create attempt if not exists
    const { data: existing } = await supabase
      .from("exam_attempts")
      .select("id,status")
      .eq("exam_id", id)
      .eq("student_id", user.id)
      .maybeSingle();

    if (existing?.status === "submitted") {
      toast.error("Already submitted", { description: "You've already completed this exam." });
      setStarting(false);
      return;
    }

    if (!existing) {
      const { error } = await supabase.from("exam_attempts").insert({
        exam_id: id, student_id: user.id, total_questions: questionCount,
      });
      if (error) {
        toast.error("Could not start", { description: error.message });
        setStarting(false);
        return;
      }
    }
    navigate(`/student/exams/${id}/take`);
  };

  if (!exam) return <AppLayout><p className="text-center py-12 text-muted-foreground">Loading…</p></AppLayout>;

  return (
    <AppLayout>
      <section className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/student"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
        </Button>

        <Card className="border-border/60 shadow-large">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{exam.name}</CardTitle>
            <CardDescription>Read the instructions carefully before starting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow icon={<FileText className="h-5 w-5" />} label="Questions" value={`${questionCount}`} />
              <InfoRow icon={<Clock className="h-5 w-5" />} label="Time limit" value={`${exam.duration_minutes} minutes`} />
            </div>

            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-warning"><AlertTriangle className="h-4 w-4" /> Important</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
                <li>Do <strong>not</strong> switch tabs or move away from this window.</li>
                <li>Each tab switch is recorded as a warning. 2+ warnings → "Suspected Cheating".</li>
                <li>Your answers auto-submit when the timer runs out.</li>
                <li>The webcam indicator must stay ON during the exam (simulated).</li>
              </ul>
            </div>

            <div className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  <span className="font-medium">Webcam permission</span>
                </div>
                {cameraOn ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> Camera ON (simulated)
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={requestCamera}>Allow camera</Button>
                )}
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
              <span className="text-sm text-muted-foreground">
                I understand the rules and agree to be monitored during the exam.
              </span>
            </label>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              disabled={!agreed || !cameraOn || starting}
              onClick={startExam}
            >
              {starting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Start exam</>}
            </Button>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</div>
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-bold">{value}</p>
    </div>
  </div>
);

export default ExamInstructions;