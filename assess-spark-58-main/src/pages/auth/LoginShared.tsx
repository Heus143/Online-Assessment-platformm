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

const LoginShared = ({ role }: Props) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isTeacher = role === "teacher";
  const home = isTeacher ? "/teacher" : "/student";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      toast.error("Login failed", { description: error?.message ?? "Try again." });
      return;
    }
    // Verify role
    const { data: r } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    setLoading(false);
    if (r?.role !== role) {
      await supabase.auth.signOut();
      toast.error("Wrong portal", {
        description: `This account is registered as ${r?.role ?? "unknown"}. Use the matching portal.`,
      });
      return;
    }
    toast.success("Welcome back!");
    navigate(home);
  };

  return (
    <RoleAuthCard
      badge={isTeacher ? "Teacher portal" : "Student portal"}
      title={isTeacher ? "Teacher sign in" : "Student sign in"}
      description={
        isTeacher
          ? "Manage your exams, view results, and monitor student attempts."
          : "Take your scheduled exams and check your results."
      }
      footer={
        <>
          New here?{" "}
          <Link to={isTeacher ? "/register/teacher" : "/register/student"} className="font-medium text-primary hover:underline">
            Create a {isTeacher ? "teacher" : "student"} account
          </Link>
          <div className="mt-2">
            <Link to={isTeacher ? "/login/student" : "/login/teacher"} className="text-xs text-muted-foreground hover:underline">
              Switch to {isTeacher ? "student" : "teacher"} portal
            </Link>
          </div>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
      </form>
    </RoleAuthCard>
  );
};

export default LoginShared;