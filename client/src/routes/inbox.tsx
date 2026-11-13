// import { createFileRoute } from "@tanstack/react-router";
// import { AppSidebar } from "@/components/app-sidebar";
// import ProtectedRoute from "@/components/Protected";
// import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import { SiteHeader } from "@/components/site-header";

// export const Route = createFileRoute("/inbox")({
//   head: () => ({ meta: [{ title: "Inbox — Tasky" }] }),
//   component: InboxPage,
// });

// function InboxPage() {
//   return (
//     <ProtectedRoute>
//       <SidebarProvider>
//         <AppSidebar variant="inset" />
//         <SidebarInset>
//           <SiteHeader title="Inbox" />
//           <div className="p-6">
//             <h2 className="text-xl font-semibold">Messages</h2>
//             <p className="text-muted-foreground mt-2">Your inbox is empty.</p>
//           </div>
//         </SidebarInset>
//       </SidebarProvider>
//     </ProtectedRoute>
//   );
// }

// import { createFileRoute } from "@tanstack/react-router";
// import { WorkspacePage } from "@/components/workspace/page";
// import { PageHeading } from "@/components/workspace/shell";
// import { useWorkspace } from "@/components/workspace/provider";

// export const Route = createFileRoute("/inbox")({
//   head: () => ({ meta: [{ title: "Inbox — Tasky" }] }),
//   component: InboxPage,
// });

// function InboxPage() {
//   const { state, markRead, respond } = useWorkspace();
//   // Render notifications/activity feed & pending team invitations...
//   return (
//     <WorkspacePage title="Inbox">
//       <PageHeading eyebrow="Notifications" title="Inbox" subtitle="Your activity updates and team invitations." />
//       {/* Activity items & invitations */}
//     </WorkspacePage>
//   );
// }
import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { PageHeading } from "@/components/workspace/shell";
import { useWorkspace } from "@/components/workspace/provider";
import { workspaceHead } from "@/lib/workspace-head";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconMail,
  IconBell,
  IconCheck,
  IconClock,
  IconUsers,
  IconSparkles,
} from "@tabler/icons-react";

export const Route = createFileRoute("/inbox")({
  head: () =>
    workspaceHead("Inbox", "Your activity updates and team invitations."),
  component: () => (
    <WorkspacePage title="Inbox">
      <InboxView />
    </WorkspacePage>
  ),
});

function InboxView() {
  // Safe: this runs inside <WorkspaceProvider>
  const { state, markRead, respond, activityError, reload } = useWorkspace();

  const pendingInvitations = state.invitations.filter(
    (inv) => inv.status === "Pending"
  );
  const unreadCount = state.activity.filter((act) => !act.read).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeading
          eyebrow="Notifications"
          title="Inbox"
          subtitle="Your activity updates and team invitations."
        />
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markRead()}
            className="gap-2 self-start sm:self-auto"
          >
            <IconCheck className="size-4" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Team Invitations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconMail className="size-5 text-indigo-500" />
          <h2 className="text-lg font-semibold tracking-tight">
            Team Invitations
          </h2>
          {pendingInvitations.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs">
              {pendingInvitations.length} pending
            </Badge>
          )}
        </div>

        {pendingInvitations.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No pending team invitations.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingInvitations.map((invite) => {
              const team = state.teams.find((t) => t.id === invite.teamId);
              return (
                <div
                  key={invite.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 shadow-xs transition hover:border-border/80"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {team?.name || "Team Invitation"}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {invite.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sent to {invite.email}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => void respond(invite.id)}
                    className="w-full gap-2"
                  >
                    <IconUsers className="size-4" />
                    Accept Invitation
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Activity Feed */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <IconBell className="size-5 text-indigo-500" />
          <h2 className="text-lg font-semibold tracking-tight">
            Recent Activity
          </h2>
        </div>

        {activityError ? (
          <div role="alert" className="space-y-3 border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">{activityError}</p>
            <Button variant="outline" size="sm" onClick={() => void reload()}>Try again</Button>
          </div>
        ) : state.activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <IconSparkles className="mb-2 size-8 opacity-40" />
            <p className="text-sm font-medium">Your activity feed is clear</p>
            <p className="text-xs">
              New updates and task assignments will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-xl border bg-card shadow-xs">
            {state.activity.map((item) => {
              const project = item.projectId
                ? state.projects.find((p) => p.id === item.projectId)
                : null;

              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 p-4 transition ${
                    !item.read ? "bg-indigo-50/40 dark:bg-indigo-950/15" : ""
                  }`}
                >
                  <div
                    className={`mt-1 size-2 rounded-full shrink-0 ${
                      !item.read ? "bg-indigo-600" : "bg-transparent"
                    }`}
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                      <span>{item.text}</span>
                      {project && (
                        <Badge variant="secondary" className="text-[11px]">
                          {project.name}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconClock className="size-3.5" />
                      <span>{new Date(item.date).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

