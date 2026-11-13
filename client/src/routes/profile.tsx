import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading, Avatar } from "@/components/workspace/shell";
import { useWorkspace } from "@/components/workspace/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workspaceHead } from "@/lib/workspace-head";

export const Route = createFileRoute("/profile")({
  head: () => workspaceHead("Profile", "Your personal details in Tasky."),
  component: () => <WorkspacePage title="Profile"><Profile /></WorkspacePage>,
});

function Profile() {
  const { user, state, updateProfile } = useWorkspace();
  const [name, setName] = useState(user.username);
  const done = state.tasks.filter(t => t.assigneeId === user.user_id && t.status === "Done").length;
  return <>
    <PageHeading eyebrow="Personal" title="Profile" subtitle="How you appear to your teammates." />
    <div className="max-w-xl rounded-xl border bg-card p-6">
      <div className="mb-6 flex items-center gap-4"><Avatar name={user.username || "?"} /><div><p className="font-medium">{user.username}</p><p className="text-xs text-muted-foreground">{user.email} · {done} tasks completed</p></div></div>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void updateProfile(name).catch(() => {}); }}>
        <div className="space-y-2"><Label htmlFor="name">Display name</Label><Input id="name" value={name} onChange={e => setName(e.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={user.email} disabled /></div>
        <Button>Save changes</Button>
      </form>
    </div>
  </>;
}
