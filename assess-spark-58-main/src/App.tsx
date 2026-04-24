import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import AuthHub from "./pages/auth/AuthHub.tsx";
import TeacherLogin from "./pages/auth/TeacherLogin.tsx";
import StudentLogin from "./pages/auth/StudentLogin.tsx";
import TeacherRegister from "./pages/auth/TeacherRegister.tsx";
import StudentRegister from "./pages/auth/StudentRegister.tsx";
import TeacherDashboard from "./pages/teacher/TeacherDashboard.tsx";
import CreateExam from "./pages/teacher/CreateExam.tsx";
import ExamDetail from "./pages/teacher/ExamDetail.tsx";
import StudentDashboard from "./pages/student/StudentDashboard.tsx";
import ExamInstructions from "./pages/student/ExamInstructions.tsx";
import TakeExam from "./pages/student/TakeExam.tsx";
import ExamResult from "./pages/student/ExamResult.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Auth */}
            <Route path="/login" element={<AuthHub mode="login" />} />
            <Route path="/register" element={<AuthHub mode="register" />} />
            <Route path="/login/teacher" element={<TeacherLogin />} />
            <Route path="/login/student" element={<StudentLogin />} />
            <Route path="/register/teacher" element={<TeacherRegister />} />
            <Route path="/register/student" element={<StudentRegister />} />

            {/* Teacher */}
            <Route path="/teacher" element={<ProtectedRoute requireRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/exams/new" element={<ProtectedRoute requireRole="teacher"><CreateExam /></ProtectedRoute>} />
            <Route path="/teacher/exams/:id" element={<ProtectedRoute requireRole="teacher"><ExamDetail /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student" element={<ProtectedRoute requireRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/exams/:id/instructions" element={<ProtectedRoute requireRole="student"><ExamInstructions /></ProtectedRoute>} />
            <Route path="/student/exams/:id/take" element={<ProtectedRoute requireRole="student"><TakeExam /></ProtectedRoute>} />
            <Route path="/student/exams/:id/result" element={<ProtectedRoute requireRole="student"><ExamResult /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
