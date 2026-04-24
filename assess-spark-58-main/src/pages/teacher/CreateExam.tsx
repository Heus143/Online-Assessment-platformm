import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Loader2, Sparkles, Upload } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { simulatePdfText, uploadSyllabusPdf } from "@/lib/storage";
import { buildQuestionsFromSyllabus } from "@/lib/examQuestions";
import { toast } from "sonner";

const CreateExam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration] = useState(30);
  const [extraText, setExtraText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    setFile(f ?? null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) {
      toast.error("PDF syllabus is required");
      return;
    }
    setSubmitting(true);
    try {
      const path = await uploadSyllabusPdf(user.id, file);
      const syllabus = simulatePdfText(file, extraText);

      const { data: exam, error: ex } = await supabase
        .from("exams")
        .insert({
          teacher_id: user.id,
          name,
          description: description || null,
          exam_date: examDate,
          duration_minutes: duration,
          syllabus_text: syllabus,
          syllabus_pdf_path: path,
          status: "published",
        })
        .select()
        .single();
      if (ex || !exam) throw ex;

      const questions = buildQuestionsFromSyllabus(syllabus).map((q) => ({ ...q, exam_id: exam.id }));
      const { error: qErr } = await supabase.from("exam_questions").insert(questions);
      if (qErr) throw qErr;

      toast.success("Exam created!", { description: `${questions.length} questions generated.` });
      navigate(`/teacher/exams/${exam.id}`);
    } catch (err: any) {
      toast.error("Could not create exam", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <section className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">New exam</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Create an exam</h1>
          <p className="mt-2 text-muted-foreground">Upload a syllabus PDF — questions will be generated automatically.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display">Exam details</CardTitle>
              <CardDescription>Set the basic information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exam name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Midterm: Photosynthesis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cover topics from chapters 1–5." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Exam date</Label>
                  <Input id="date" type="date" required value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dur">Duration (minutes)</Label>
                  <Input id="dur" type="number" min={5} max={240} required value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><FileUp className="h-5 w-5" /> Syllabus</CardTitle>
              <CardDescription>PDF upload is required. Optional text adds extra context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="pdf" className="block">
                <div className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${file ? "border-success bg-success/5" : "border-border bg-secondary/30 hover:border-primary"}`}>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  {file ? (
                    <>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · click to change</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Click to upload syllabus PDF</p>
                      <p className="text-xs text-muted-foreground">PDF only · required</p>
                    </>
                  )}
                </div>
                <Input id="pdf" type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
              </Label>

              <div className="space-y-2">
                <Label htmlFor="extra">Additional notes (optional)</Label>
                <Textarea id="extra" value={extraText} onChange={(e) => setExtraText(e.target.value)} placeholder="Add extra topics or context to enrich the question generation." className="min-h-[100px]" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="hero" size="lg" disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating exam…</> : <><Sparkles className="mr-2 h-4 w-4" /> Create & generate questions</>}
            </Button>
          </div>
        </form>
      </section>
    </AppLayout>
  );
};

export default CreateExam;