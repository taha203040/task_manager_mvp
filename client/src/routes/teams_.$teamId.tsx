import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading, NewButton, Avatar } from "@/components/workspace/shell";
import { ProjectCard } from "@/components/workspace/dashboard";
import { ProjectForm, TeamForm, InviteForm, ConfirmDelete } from "@/components/workspace/forms";
import { useWorkspace } from "@/components/workspace/provider";
import { Button } from "@/components/ui/button";
import { workspaceHead } from "@/lib/workspace-head";
import type { Member } from "@/lib/workspace-model";

export const Route = createFileRoute("/teams_/$teamId")({
  head: () => workspaceHead("Team", "Team members, roles and projects."),
  component: () => <WorkspacePage title="Team"><TeamDetail /></WorkspacePage>,
});

function TeamDetail() {
  const { teamId } = Route.useParams();
  const { state, user, remove, member } = useWorkspace();
  const navigate = Route.useNavigate();
  const [dialog, setDialog] = useState<"" | "edit" | "project" | "invite" | "delete">("");
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return <div className="py-24 text-center"><p className="text-muted-foreground">Team not found.</p><Link to="/teams" className="mt-3 inline-block text-sm text-primary">Back to teams</Link></div>;
  const myRole = team.members.find(m => m.id === user.user_id)?.role;
  const canManage = myRole === "Owner" || myRole === "Admin";
  console.log('the right to edit',myRole,canManage,team.members,user)
  const projects = state.projects.filter(p => p.teamId === team.id);
  const pending = state.invitations.filter(i => i.teamId === team.id && i.status === "Pending");
  return <>
    <PageHeading eyebrow="Team" title={team.name} subtitle={team.description} action={canManage && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDialog("edit")}>Edit</Button>{myRole === "Owner" && <Button variant="outline" onClick={() => setDialog("delete")}>Delete</Button>}<Button variant="outline" onClick={() => setDialog("invite")}>Invite</Button><NewButton onClick={() => setDialog("project")}>New project</NewButton></div>} />
    <h2 className="mb-4 text-sm font-semibold">Projects</h2>
    {projects.length ? <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div> : <p className="mb-10 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No projects yet.</p>}
    <h2 className="mb-4 text-sm font-semibold">Members · {team.members.length}</h2>
    <div className="divide-y rounded-xl border bg-card">{team.members.map(m => <div key={m.id} className="flex flex-wrap items-center gap-3 p-4"><Avatar name={m.name} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{m.name}</p><p className="truncate text-xs text-muted-foreground">{m.email}</p></div>
      {canManage && m.role !== "Owner" && m.id !== user.user_id ? <div className="flex items-center gap-2"><select aria-label={`Role for ${m.name}`} className="h-8 rounded-md border bg-background px-2 text-xs" value={m.role} onChange={e => void member(team.id, m.id, e.target.value as Member["role"]).catch(() => {})}><option>Admin</option><option>Member</option></select><Button size="sm" variant="ghost" onClick={() => void member(team.id, m.id).catch(() => {})}>Remove</Button></div> : <span className="text-xs text-muted-foreground">{m.role}</span>}
    </div>)}</div>
    {pending.length > 0 && <><h2 className="mb-4 mt-10 text-sm font-semibold">Pending invitations</h2><div className="divide-y rounded-xl border bg-card">{pending.map(i => <div key={i.id} className="flex justify-between p-4 text-sm"><span>{i.email}</span><span className="text-xs text-muted-foreground">{i.role}</span></div>)}</div></>}
    {dialog === "edit" && <TeamForm team={team} onClose={() => setDialog("")} />}
    {dialog === "project" && <ProjectForm teamId={team.id} onClose={() => setDialog("")} />}
    {dialog === "invite" && <InviteForm teamId={team.id} onClose={() => setDialog("")} />}
    {dialog === "delete" && <ConfirmDelete name={team.name} onClose={() => setDialog("")} onConfirm={async () => { await remove("teams", team.id); navigate({ to: "/teams" }); }} />}
  </>;
}
