import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, BookOpen, CheckCircle2, ShieldAlert, Eye } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ExamWithAttempt {
  id: string;
  name: string;
  description: string | null;
  exam_date: string;
  duration_minutes: number;
  attempt?: {
    id: string;
    status: string;
    score: number;
    total_questions: number;
    cheating_status: string | null;
    announced: boolean;
  };
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [exams, setExams] = useState<ExamWithAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: exs }, { data: atts }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("exams").select("id,name,description,exam_date,duration_minutes").eq("status", "published").order("exam_date"),
        supabase.from("exam_attempts").select("id,exam_id,status,score,total_questions,cheating_status,announced").eq("student_id", user.id),
      ]);
      setName(prof?.display_name || user.email?.split("@")[0] || "Student");
      const byExam = new Map((atts ?? []).map((a) => [a.exam_id, a]));
      setExams((exs ?? []).map((e) => ({ ...e, attempt: byExam.get(e.id) as any })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppLayout>
      <section className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Student portal</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Hello, {name} 👋</h1>
          <p className="mt-2 text-muted-foreground">Here are the exams available to you.</p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading…</p>
        ) : exams.length === 0 ? (
          <Card className="border-border/60 shadow-soft">
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No exams published yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {exams.map((e) => {
              const submitted = e.attempt?.status === "submitted";
              return (
                <Card key={e.id} className="border-border/60 shadow-soft transition hover:shadow-large">
                  <CardHeader>
                    <CardTitle className="font-display text-xl">{e.name}</CardTitle>
                    {e.description && <CardDescription>{e.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(e.exam_date).toLocaleDateString()}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {e.duration_minutes} min</span>
                    </div>

                    {submitted ? (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                          <p className="text-sm">
                            Your score: <span className="font-bold">{e.attempt!.score}/{e.attempt!.total_questions}</span>
                          </p>
                          {e.attempt!.cheating_status && (
                            <p className="mt-1">
                              {e.attempt!.cheating_status === "Suspected Cheating" ? (
                                <Badge className="bg-destructive text-destructive-foreground"><ShieldAlert className="mr-1 h-3 w-3" /> {e.attempt!.cheating_status}</Badge>
                              ) : (
                                <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> {e.attempt!.cheating_status}</Badge>
                              )}
                            </p>
                          )}
                          {e.attempt!.announced && (
                            <p className="mt-1 text-xs text-success">✉️ Result email sent</p>
                          )}
                        </div>
                        <Button asChild variant="outline" className="w-full">
                          <Link to={`/student/exams/${e.id}/result`}><Eye className="mr-2 h-4 w-4" /> View result</Link>
                        </Button>
                      </div>
                    ) : (
                      <Button asChild variant="hero" className="w-full">
                        <Link to={`/student/exams/${e.id}/instructions`}>Start exam</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default StudentDashboard;