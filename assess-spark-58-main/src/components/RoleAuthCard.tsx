import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  description: string;
  badge: string;
  children: ReactNode;
  footer: ReactNode;
}

const RoleAuthCard = ({ title, description, badge, children, footer }: Props) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4 py-12">
    <div className="w-full max-w-md">
      <Link to="/" className="mb-8 flex items-center justify-center gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tight">FIOAP</span>
      </Link>
      <Card className="border-border/60 shadow-large">
        <CardHeader className="space-y-2 text-center">
          <span className="mx-auto inline-flex w-fit items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            {badge}
          </span>
          <CardTitle className="font-display text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default RoleAuthCard;