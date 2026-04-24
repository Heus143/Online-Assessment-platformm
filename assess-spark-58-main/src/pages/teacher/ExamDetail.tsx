import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, AlertTriangle, CheckCircle2, Download, Mail, Loader2, ShieldAlert,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Exam {
  id: string; name: string; description: string | null; exam_date: string;
  duration_minutes: number; status: string; syllabus_pdf_path: string | null;
}
interface AttemptRow {
  id: string;
  student_id: string;
  score: number;
  total_questions: number;
  warning_count: number;
  cheating_status: string | null;
  status: string;
  submitted_at: string | null;
  announced: boolean;
  display_name: string;
  email: string;
}
interface EventRow {
  id: string; event_type: string; message: string | null; created_at: string;
}

const ExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAttempt, setActiveAttempt] = useState<AttemptRow | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [announcing, setAnnouncing] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: e } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
    setExam(e as any);

    const { data: atts } = await supabase
      .from("exam_attempts")
      .select("id,student_id,score,total_questions,warning_count,cheating_status,status,submitted_at,announced")
      .eq("exam_id", id)
      .order("submitted_at", { ascending: false });

    const studentIds = (atts ?? []).map((a) => a.student_id);
    let profiles: Record<string, { display_name: string | null; email: string | null }> = {};
    if (studentIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,email")
        .in("id", studentIds);
      profiles = (profs ?? []).reduce<typeof profiles>((acc, p) => {
        acc[p.id] = { display_name: p.display_name, email: p.email };
        return acc;
      }, {});
    }

    setAttempts((atts ?? []).map((a) => ({
      ...a,
      display_name: profiles[a.student_id]?.display_name || "Unknown",
      email: profiles[a.student_id]?.email || "—",
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const openAttempt = async (a: AttemptRow) => {
    setActiveAttempt(a);
    const { data } = await supabase
      .from("attempt_events")
      .select("id,event_type,message,created_at")
      .eq("attempt_id", a.id)
      .order("created_at");
    setEvents(data ?? []);
  };

  const downloadHistory = (a: AttemptRow) => {
    const lines = [
      `Student,${a.display_name}`,
      `Email,${a.email}`,
      `Exam,${exam?.name ?? ""}`,
      `Score,${a.score}/${a.total_questions}`,
      `Warnings,${a.warning_count}`,
      `Status,${a.cheating_status ?? "n/a"}`,
      `Submitted,${a.submitted_at ?? "—"}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${a.display_name.replace(/\s+/g, "_")}_history.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const announceResults = async () => {
    const submitted = attempts.filter((a) => a.status === "submitted" && !a.announced);
    if (!submitted.length) {
      toast.info("Nothing new to announce", { description: "All submitted results have been announced." });
      return;
    }
    setAnnouncing(true);
    const { error } = await supabase
      .from("exam_attempts")
      .update({ announced: true })
      .in("id", submitted.map((a) => a.id));
    if (error) {
      setAnnouncing(false);
      toast.error("Could not announce", { description: error.message });
      return;
    }
    submitted.forEach((a) => {
      toast.success(`Result sent to ${a.email}`, {
        description: `${a.display_name} · Score ${a.score}/${a.total_questions} · ${a.cheating_status ?? "Pending"}`,
      });
    });
    setAnnouncing(false);
    load();
  };

  if (loading) {
    return <AppLayout><p className="text-center py-12 text-muted-foreground">Loading…</p></AppLayout>;
  }
  if (!exam) {
    return <AppLayout><p className="text-center py-12 text-muted-foreground">Exam not found.</p></AppLayout>;
  }

  return (
    <AppLayout>
      <section className="mx-auto max-w-6xl space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/teacher"><ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard</Link>
        </Button>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{exam.name}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(exam.exam_date).toLocaleDateString()} · {exam.duration_minutes} minutes · status: {exam.status}
            </p>
          </div>
          <Button onClick={announceResults} variant="hero" disabled={announcing}>
            {announcing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><Mail className="mr-2 h-4 w-4" /> Announce results</>}
          </Button>
        </div>

        {exam.description && (
          <Card className="border-border/60 shadow-soft">
            <CardContent className="p-6 text-sm text-muted-foreground">{exam.description}</CardContent>
          </Card>
        )}

        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Student results</CardTitle>
            <CardDescription>Click a row to view the cheating report.</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No students have attempted this exam yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Warnings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Announced</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((a) => (
                    <TableRow key={a.id} className="cursor-pointer" onClick={() => openAttempt(a)}>
                      <TableCell className="font-medium">{a.display_name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.email}</TableCell>
                      <TableCell>{a.status === "submitted" ? `${a.score}/${a.total_questions}` : "—"}</TableCell>
                      <TableCell>
                        {a.warning_count > 0 ? (
                          <span className="inline-flex items-center gap-1 text-warning"><AlertTriangle className="h-4 w-4" /> {a.warning_count}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.cheating_status === "Suspected Cheating" ? (
                          <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><ShieldAlert className="mr-1 h-3 w-3" /> {a.cheating_status}</Badge>
                        ) : a.cheating_status === "Genuine Attempt" ? (
                          <Badge className="bg-success text-success-foreground hover:bg-success/90"><CheckCircle2 className="mr-1 h-3 w-3" /> {a.cheating_status}</Badge>
                        ) : (
                          <Badge variant="secondary">In progress</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {a.announced ? <Badge variant="secondary">Sent</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); downloadHistory(a); }}>
                          <Download className="mr-1 h-3 w-3" /> History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!activeAttempt} onOpenChange={(o) => !o && setActiveAttempt(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cheating report — {activeAttempt?.display_name}</DialogTitle>
            <DialogDescription>
              Warnings: {activeAttempt?.warning_count} · Final status: {activeAttempt?.cheating_status ?? "Pending"}
            </DialogDescription>
          </DialogHeader>
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No suspicious activity logged.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {events.map((ev) => (
                <li key={ev.id} className="rounded-lg border border-border/60 bg-secondary/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{ev.event_type.replace(/_/g, " ")}</span>
                    <span className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleTimeString()}</span>
                  </div>
                  {ev.message && <p className="mt-1 text-muted-foreground">{ev.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ExamDetail;