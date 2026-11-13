import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading } from "@/components/workspace/shell";
import { TaskViews } from "@/components/workspace/tasks";
import { workspaceHead } from "@/lib/workspace-head";

export const Route = createFileRoute("/my-tasks")({
  head: () => workspaceHead("My tasks", "Every task assigned to you across all projects."),
  component: () => <WorkspacePage title="My tasks"><PageHeading eyebrow="Personal" title="My tasks" subtitle="Everything assigned to you, in one place." /><TaskViews mine /></WorkspacePage>,
});
