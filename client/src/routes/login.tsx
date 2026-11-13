import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckSquare, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { workspaceHead } from "@/lib/workspace-head";
import { AuthBackground } from "@/components/auth-background";

export const Route = createFileRoute("/login")({
  head: () => workspaceHead("Login", "Sign in to your Tasky workspace."),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="relative min-h-svh flex flex-col items-center justify-center p-6 md:p-10">
      {/* Background with floating round pens, papers, and clipboards */}
      <AuthBackground />

      {/* Back to landing */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to home
      </Link>

      <div className="flex w-full max-w-sm flex-col gap-6 z-10">
        <Link to="/" className="flex items-center gap-2 self-center font-semibold text-lg tracking-tight">
          <div className="bg-indigo-600 text-white flex size-8 items-center justify-center rounded-lg shadow-sm">
            <CheckSquare className="size-4.5" />
          </div>
          Tasky
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
