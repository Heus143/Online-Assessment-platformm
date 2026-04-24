import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldAlert, Mail, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ExamResult = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data: att } = await supabase
        .from("exam_attempts")
        .select("*, exams(name)")
        .eq("exam_id", id)
        .eq("student_id", user.id)
        .maybeSingle();
      setData(att);
    })();
  }, [id, user]);

  if (!data) return <AppLayout><p className="text-center py-12 text-muted-foreground">Loading…</p></AppLayout>;

  const pct = data.total_questions ? Math.round((data.score / data.total_questions) * 100) : 0;
  const passed = pct >= 60;
  const cheating = data.cheating_status === "Suspected Cheating";

  return (
    <AppLayout>
      <section className="mx-auto max-w-2xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/student"><ArrowLeft className="mr-1 h-4 w-4" /> Back to my exams</Link>
        </Button>

        <Card className="overflow-hidden border-border/60 shadow-large">
          <div className={`p-8 text-center ${cheating ? "bg-destructive/10" : "bg-gradient-primary text-primary-foreground"}`}>
            <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{data.exams?.name}</p>
            <p className="mt-2 font-display text-6xl font-extrabold">{data.score}/{data.total_questions}</p>
            <p className="mt-1 font-display text-xl">{pct}%</p>
          </div>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-3">
              {cheating ? (
                <Badge className="bg-destructive text-destructive-foreground"><ShieldAlert className="mr-1 h-3 w-3" /> Suspected Cheating</Badge>
              ) : (
                <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> Genuine Attempt</Badge>
              )}
              {data.warning_count > 0 && (
                <span className="inline-flex items-center gap-1 text-sm text-warning"><AlertTriangle className="h-4 w-4" /> {data.warning_count} warning{data.warning_count > 1 ? "s" : ""}</span>
              )}
              <Badge variant={passed ? "default" : "secondary"}>{passed ? "Passed" : "Needs improvement"}</Badge>
            </div>
            {data.announced ? (
              <div className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-success"><Mail className="h-4 w-4" /> Result email sent</p>
                <p className="mt-1 text-muted-foreground">Your teacher has officially announced this result.</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Your teacher hasn't announced the official results yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
};

export default ExamResult;