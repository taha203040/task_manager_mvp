import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading, NewButton } from "@/components/workspace/shell";
import { ProjectCard } from "@/components/workspace/dashboard";
import { ProjectForm } from "@/components/workspace/forms";
import { useWorkspace } from "@/components/workspace/provider";
import { projectStatuses } from "@/lib/workspace-model";
import { workspaceHead } from "@/lib/workspace-head";

export const Route = createFileRoute("/projects")({
  head: () => workspaceHead("Projects", "All projects across your teams."),
  component: () => <WorkspacePage title="Projects"><Projects /></WorkspacePage>,
});

function Projects() {
  const { state } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("All");
  const list = state.projects.filter(p => status === "All" || p.status === status);
  return <>
    <PageHeading eyebrow="Workspace" title="Projects" subtitle="Everything your teams are working on." action={state.teams.length > 0 && <NewButton onClick={() => setOpen(true)}>New project</NewButton>} />
    <div className="mb-6 flex flex-wrap gap-2">{["All", ...projectStatuses].map(s => <button key={s} onClick={() => setStatus(s)} className={`rounded-md border px-3 py-1.5 text-xs ${status === s ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>{s}</button>)}</div>
    {list.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(p => <ProjectCard key={p.id} project={p} />)}</div> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{state.teams.length ? "No projects here yet." : "Create a team first, then add projects to it."}</p>}
    {open && <ProjectForm onClose={() => setOpen(false)} />}
  </>;
}
