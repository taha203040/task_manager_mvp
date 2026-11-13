import type { ReactNode } from "react";
import ProtectedRoute from "@/components/Protected";
import { WorkspaceProvider, useWorkspace } from "./provider";
import { WorkspaceShell } from "./shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function Body({ children }: { children: ReactNode }) {
  const { loading, error, reload } = useWorkspace();
  if (loading) return <div className="flex justify-center py-24 text-muted-foreground"><Spinner /></div>;
  if (error) return <div className="mx-auto max-w-md rounded-xl border bg-card p-6 text-center"><p className="text-sm text-muted-foreground">{error}</p><Button className="mt-4" onClick={() => void reload()}>Try again</Button></div>;
  return <>{children}</>;
}

// src/components/workspace/page.tsx
export function WorkspacePage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ProtectedRoute>
      <WorkspaceProvider>
        <WorkspaceShell title={title}>
          <Body>{children}</Body>
        </WorkspaceShell>
      </WorkspaceProvider>
    </ProtectedRoute>
  );
}

