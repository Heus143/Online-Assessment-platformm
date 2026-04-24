import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Users2, Calendar, ArrowRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ExamRow {
  id: string;
  name: string;
  exam_date: string;
  duration_minutes: number;
  status: string;
  attempts: number;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: exs }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("exams").select("id,name,exam_date,duration_minutes,status").eq("teacher_id", user.id).order("created_at", { ascending: false }),
      ]);
      setName(prof?.display_name || user.email?.split("@")[0] || "Teacher");

      const examIds = (exs ?? []).map((e) => e.id);
      let counts: Record<string, number> = {};
      if (examIds.length) {
        const { data: atts } = await supabase
          .from("exam_attempts")
          .select("exam_id")
          .in("exam_id", examIds);
        counts = (atts ?? []).reduce<Record<string, number>>((acc, a) => {
          acc[a.exam_id] = (acc[a.exam_id] || 0) + 1;
          return acc;
        }, {});
      }
      setExams((exs ?? []).map((e) => ({ ...e, attempts: counts[e.id] || 0 })));
      setLoading(false);
    })();
  }, [user]);

  const totalAttempts = exams.reduce((sum, e) => sum + e.attempts, 0);

  return (
    <AppLayout>
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Teacher portal</p>
            <h1 className="mt-1 font-display text-4xl font-bold tracking-tight">Welcome, {name}</h1>
            <p className="mt-2 text-muted-foreground">Create exams from your syllabus and track student performance.</p>
          </div>
          <Button asChild variant="hero" size="lg">
            <Link to="/teacher/exams/new"><Plus className="mr-2 h-4 w-4" /> New exam</Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard icon={<FileText className="h-6 w-6" />} label="Total exams" value={exams.length} />
          <StatCard icon={<Users2 className="h-6 w-6" />} label="Student attempts" value={totalAttempts} />
          <StatCard icon={<Calendar className="h-6 w-6" />} label="Upcoming" value={exams.filter(e => new Date(e.exam_date) >= new Date()).length} />
        </div>

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Your exams</CardTitle>
            <CardDescription>Click any exam to view results and cheating reports.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-muted-foreground">Loading…</p>
            ) : exams.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">You haven't created any exams yet.</p>
                <Button asChild variant="hero" className="mt-4">
                  <Link to="/teacher/exams/new"><Plus className="mr-2 h-4 w-4" /> Create your first exam</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {exams.map((e) => (
                  <li key={e.id}>
                    <Link to={`/teacher/exams/${e.id}`} className="flex items-center justify-between py-4 transition hover:bg-secondary/40 -mx-2 px-2 rounded-lg">
                      <div>
                        <p className="font-medium">{e.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(e.exam_date).toLocaleDateString()} · {e.duration_minutes} min · {e.attempts} attempt{e.attempts === 1 ? "" : "s"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{e.status}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card className="border-border/60 shadow-soft">
    <CardContent className="flex items-center gap-4 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">{icon}</div>
      <div>
        <p className="font-display text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default TeacherDashboard;