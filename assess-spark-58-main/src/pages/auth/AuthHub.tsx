import { Link } from "react-router-dom";
import { GraduationCap, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Route stubs at /login and /register that prompt the user to pick a role */
const AuthHub = ({ mode }: { mode: "login" | "register" }) => {
  const action = mode === "login" ? "Sign in" : "Create account";
  const base = `/${mode}`;
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-12">
      <div className="w-full max-w-2xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">FIOAP</span>
        </Link>
        <h1 className="text-center font-display text-3xl font-bold">Choose your portal</h1>
        <p className="mt-2 text-center text-muted-foreground">Pick the role you want to {action.toLowerCase()} as.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="border-border/60 shadow-soft transition hover:shadow-large">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-bold">Teacher</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create exams, monitor students, manage results.</p>
              <Button asChild variant="hero" className="mt-4 w-full">
                <Link to={`${base}/teacher`}>{action} as teacher</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-soft transition hover:shadow-large">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-bold">Student</h2>
              <p className="mt-2 text-sm text-muted-foreground">Take scheduled exams and track your scores.</p>
              <Button asChild variant="hero" className="mt-4 w-full">
                <Link to={`${base}/student`}>{action} as student</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthHub;