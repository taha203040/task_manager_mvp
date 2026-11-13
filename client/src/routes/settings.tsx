import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading } from "@/components/workspace/shell";
import { useWorkspace } from "@/components/workspace/provider";
import { Switch } from "@/components/ui/switch";
import { workspaceHead } from "@/lib/workspace-head";

export const Route = createFileRoute("/settings")({
  head: () => workspaceHead("Settings", "Workspace appearance and notification preferences."),
  component: () => <WorkspacePage title="Settings"><Settings /></WorkspacePage>,
});

function Settings() {
  const { demo } = useWorkspace();
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = (v: boolean) => { setDark(v); document.documentElement.classList.toggle("dark", v); localStorage.setItem("tasky_theme", v ? "dark" : "light"); };
  return <>
    <PageHeading eyebrow="Personal" title="Settings" subtitle="Tune Tasky to the way you work." />
    <div className="max-w-xl divide-y rounded-xl border bg-card">
      <div className="flex items-center justify-between p-5"><div><p className="text-sm font-medium">Dark mode</p><p className="text-xs text-muted-foreground">Easier on the eyes at night.</p></div><Switch aria-label="Dark mode" checked={dark} onCheckedChange={toggle} /></div>
      <div className="flex items-center justify-between p-5"><div><p className="text-sm font-medium">Connection</p><p className="text-xs text-muted-foreground">{demo ? "Demo workspace (sample data)" : "Connected to your server"}</p></div></div>
    </div>
  </>;
}
