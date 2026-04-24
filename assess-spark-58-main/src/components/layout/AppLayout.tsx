import { ReactNode } from "react";
import Navbar from "./Navbar";

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <main className="container py-10">{children}</main>
    </div>
  );
};

export default AppLayout;