import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DashboardView } from "@/components/workspace/dashboard";
import { workspaceHead } from "@/lib/workspace-head";

export const Route = createFileRoute("/dashboard")({
  head: () => workspaceHead("Dashboard", "Your priorities, projects and team activity at a glance."),
  component: () => <WorkspacePage title="Dashboard"><DashboardView /></WorkspacePage>,
});
