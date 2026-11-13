import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading, NewButton, Avatar } from "@/components/workspace/shell";
import { TaskViews, Status, dueLabel } from "@/components/workspace/tasks";
import { ProjectForm, TaskForm, ConfirmDelete } from "@/components/workspace/forms";
import { useWorkspace } from "@/components/workspace/provider";
import { projectProgress } from "@/lib/workspace-model";
import { Button } from "@/components/ui/button";
import { workspaceHead } from "@/lib/workspace-head";

export const Route = createFileRoute("/projects_/$projectId")({
  head: () => workspaceHead("Project", "Project tasks, progress and members."),
  component: () => <WorkspacePage title="Project"><ProjectDetail /></WorkspacePage>,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { state, remove } = useWorkspace();
  const navigate = Route.useNavigate();
  const [dialog, setDialog] = useState<"" | "edit" | "task" | "delete">("");
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return <div className="py-24 text-center"><p className="text-muted-foreground">Project not found.</p><Link to="/projects" className="mt-3 inline-block text-sm text-primary">Back to projects</Link></div>;
  const team = state.teams.find(t => t.id === project.teamId);
  const members = team?.members.filter(m => project.memberIds.includes(m.id)) ?? [];
  return <>
    <PageHeading eyebrow={team?.name} title={project.name} subtitle={project.description} action={<div className="flex gap-2"><Button variant="outline" onClick={() => setDialog("edit")}>Edit</Button><Button variant="outline" onClick={() => setDialog("delete")}>Delete</Button><NewButton onClick={() => setDialog("task")}>New task</NewButton></div>} />
    <div className="mb-8 grid gap-4 sm:grid-cols-4">
      <div className="rounded-xl border bg-card p-4"><p className="text-[11px] text-muted-foreground">Status</p><div className="mt-2"><Status value={project.status} /></div></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-[11px] text-muted-foreground">Progress</p><p className="mt-1 text-lg font-semibold">{projectProgress(project.id, state.tasks)}%</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-[11px] text-muted-foreground">Due</p><p className="mt-1 text-lg font-semibold">{dueLabel(project.dueDate)}</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-[11px] text-muted-foreground">Members</p><div className="mt-2 flex -space-x-2">{members.map(m => <Avatar key={m.id} name={m.name} small />)}</div></div>
    </div>
    <TaskViews projectId={project.id} />
    {dialog === "edit" && <ProjectForm project={project} onClose={() => setDialog("")} />}
    {dialog === "task" && <TaskForm projectId={project.id} onClose={() => setDialog("")} />}
    {dialog === "delete" && <ConfirmDelete name={project.name} onClose={() => setDialog("")} onConfirm={async () => { await remove("projects", project.id); navigate({ to: "/projects" }); }} />}
  </>;
}
