import { createFileRoute } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";
import { SignupForm } from "@/components/signup-form";
import { workspaceHead } from "@/lib/workspace-head";
import { AuthBackground } from "@/components/auth-background";

export const Route = createFileRoute("/signup")({
  head: () => workspaceHead("Sign up", "Create your Tasky account and collaborate on projects."),
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
          <AuthBackground />
    
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Tasky
        </a>
        <SignupForm />
      </div>
    </div>
  );
}
