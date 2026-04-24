import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RoleAuthCard from "@/components/RoleAuthCard";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props { role: AppRole }

const RegisterShared = ({ role }: Props) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isTeacher = role === "teacher";
  const home = isTeacher ? "/teacher" : "/student";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password too short", { description: "Use at least 6 characters." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${home}`,
        data: { display_name: displayName, role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Registration failed", { description: error.message });
      return;
    }
    toast.success("Account created!", { description: "Welcome to FIOAP." });
    navigate(home);
  };

  return (
    <RoleAuthCard
      badge={isTeacher ? "Teacher portal" : "Student portal"}
      title={isTeacher ? "Create a teacher account" : "Create a student account"}
      description={
        isTeacher
          ? "Build exams from your syllabus and track student performance."
          : "Join FIOAP to take secure online assessments."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link to={isTeacher ? "/login/teacher" : "/login/student"} className="font-medium text-primary hover:underline">
            Sign in
          </Link>
          <div className="mt-2">
            <Link to={isTeacher ? "/register/student" : "/register/teacher"} className="text-xs text-muted-foreground hover:underline">
              Register as {isTeacher ? "student" : "teacher"} instead
            </Link>
          </div>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Jane Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </Button>
      </form>
    </RoleAuthCard>
  );
};

export default RegisterShared;