import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading, NewButton, Avatar } from "@/components/workspace/shell";
import { TeamForm } from "@/components/workspace/forms";
import { useWorkspace } from "@/components/workspace/provider";
import { workspaceHead } from "@/lib/workspace-head";

export const Route = createFileRoute("/teams")({
  head: () => workspaceHead("Teams", "Teams you belong to and their members."),
  component: () => <WorkspacePage title="Teams"><Teams /></WorkspacePage>,
});

function Teams() {
  const { state } = useWorkspace();
  const [open, setOpen] = useState(false);
  return <>
    <PageHeading eyebrow="Organization" title="Teams" subtitle="The people you build with." action={<NewButton onClick={() => setOpen(true)}>New team</NewButton>} />
    {state.teams.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{state.teams.map(t => <Link key={t.id} to="/teams/$teamId" params={{ teamId: t.id }} className="block rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
      <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">{t.avatar}</span>
      <h3 className="mt-4 text-sm font-semibold">{t.name}</h3>
      <p className="mt-1.5 line-clamp-2 min-h-9 text-[11px] text-muted-foreground">{t.description}</p>
      <div className="mt-4 flex items-center justify-between"><div className="flex -space-x-2">{t.members.slice(0, 4).map(m => <Avatar key={m.id} name={m.name} small />)}</div><span className="text-[10px] text-muted-foreground">{state.projects.filter(p => p.teamId === t.id).length} projects</span></div>
    </Link>)}</div> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No teams yet. Create your first one.</p>}
    {open && <TeamForm onClose={() => setOpen(false)} />}
  </>;
}
