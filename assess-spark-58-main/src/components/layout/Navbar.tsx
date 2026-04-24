import { Link, useNavigate, useLocation } from "react-router-dom";
import { GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out", { description: "See you soon!" });
    navigate("/login");
  };

  const linkCls = (path: string) =>
    `text-sm font-medium transition-colors ${
      location.pathname.startsWith(path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  const home = role === "teacher" ? "/teacher" : role === "student" ? "/student" : "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to={user ? home : "/"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">FIOAP</span>
        </Link>

        <nav className="flex items-center gap-6">
          {user && role === "teacher" ? (
            <>
              <Link to="/teacher" className={linkCls("/teacher")}>Dashboard</Link>
              <Link to="/teacher/exams/new" className={linkCls("/teacher/exams/new")}>Create exam</Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : user && role === "student" ? (
            <>
              <Link to="/student" className={linkCls("/student")}>My exams</Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login/student" className={linkCls("/login/student")}>Student login</Link>
              <Link to="/login/teacher" className={linkCls("/login/teacher")}>Teacher login</Link>
              <Button asChild size="sm" variant="hero">
                <Link to="/register/student">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;