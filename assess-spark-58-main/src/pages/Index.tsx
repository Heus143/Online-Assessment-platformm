import { Link } from "react-router-dom";
import {
  ArrowRight, GraduationCap, ShieldCheck, FileUp, Camera, Timer, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";

const features = [
  { icon: FileUp, title: "PDF syllabus", desc: "Upload a syllabus PDF — questions are generated automatically." },
  { icon: Timer, title: "Timed exams", desc: "Real-time countdown with auto-submit when time runs out." },
  { icon: Camera, title: "Webcam monitoring", desc: "Simulated webcam indicator keeps students focused." },
  { icon: ShieldCheck, title: "Tab-switch detection", desc: "Track warnings and flag suspected cheating automatically." },
  { icon: BarChart3, title: "Result panel", desc: "Teachers review scores, warning counts and announce results." },
  { icon: GraduationCap, title: "Two portals", desc: "Separate experiences for teachers and students." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />

      <main>
        <section className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure online assessment
            </div>
            <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight md:text-6xl">
              A complete framework for{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">online assessment</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              FIOAP gives teachers a full exam workflow — from PDF syllabus to live monitoring — and gives students a fair, timed test environment.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:max-w-lg sm:mx-auto">
              <Button asChild size="lg" variant="hero">
                <Link to="/register/teacher">
                  I'm a teacher <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/register/student">
                  I'm a student <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/login/teacher" className="font-medium text-primary hover:underline">Teacher sign in</Link>
              {" · "}
              <Link to="/login/student" className="font-medium text-primary hover:underline">Student sign in</Link>
            </p>
          </div>
        </section>

        <section className="container pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border/60 shadow-soft transition-all hover:shadow-large hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="container flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">FIOAP</span>
          </div>
          <span>© {new Date().getFullYear()} FIOAP</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
