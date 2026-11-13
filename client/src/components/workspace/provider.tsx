import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import {
  acceptInvitation,
  validateAssignment,
  type Workspace,
  type Team,
  type Project,
  type Task,
  type Member,
} from "@/lib/workspace-model";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { normalizeTask, taskPayload, normalizeMembers, mergeMembers, taskApiError } from "@/lib/task-adapter";
import { normalizeActivity } from "@/lib/activity-adapter";

const empty: Workspace = { teams: [], projects: [], tasks: [], activity: [], invitations: [] };
type User = { user_id: string; username: string; email: string };
type Context = {
  state: Workspace;
  user: User;
  demo: boolean;
  loading: boolean;
  error: string;
  activityError: string;
  reload: () => Promise<void>;
  saveTeam: (team: Team) => Promise<void>;
  saveProject: (project: Project) => Promise<void>;
  saveTask: (task: Task) => Promise<void>;
  assignmentMembers: (projectId: string) => Promise<Member[]>;
  remove: (kind: "teams" | "projects" | "tasks", id: string) => Promise<void>;
  invite: (teamId: string, email: string, role: Member["role"]) => Promise<void>;
  respond: (id: string) => Promise<void>;
  member: (teamId: string, memberId: string, role?: Member["role"]) => Promise<void>;
  markRead: () => void;
  updateProfile: (name: string) => Promise<void>;
};
const WorkspaceContext = createContext<Context | null>(null);
const id = () => crypto.randomUUID();
const rows = (data: any, key: string): any[] =>
  Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [];
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<Workspace>(empty);
  const [user, setUser] = useState<User>({ user_id: "", username: "", email: "" });
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");
  const reload = async () => {
    setDemo(false);
    setLoading(true);
    setError("");
    setActivityError("");

    try {
      const [u, ts, ps, tasks, invs, activity] = await Promise.all([
        api.get("/users/info"),
        api.get("/teams"),
        api.get("/projects"),
        api.get("/tasks/"),
        api.get("/invites/user/").catch(() => ({ data: [] })),
        api.get("/activity")
          .then((response) => normalizeActivity(response.data))
          .catch(() => {
            setActivityError("Could not load recent activity. Please try again.");
            return [];
          }),
      ]);

      setUser(u.data);

      const teams = await Promise.all(
        rows(ts.data, "teams").map(async (t) => ({
          id: String(t.team_id ?? t.id),
          name: t.name,
          description: t.description ?? "",
          avatar: t.name.slice(0, 2).toUpperCase(),
          members: rows((await api.get(`/members/t/${t.team_id ?? t.id}`)).data, "members").map(
            (m) => ({
              id: String(m.user_id),
              name: m.name ?? m.username ?? m.email,
              email: m.email ?? "",
              role: (m.role?.toLowerCase() === "owner"
                ? "Owner"
                : m.role?.toLowerCase() === "admin"
                  ? "Admin"
                  : "Member") as Member["role"],
            }),
          ),
        })),
      );

      const invitations = rows(invs.data, "invites").map((inv: any) => ({
        id: String(inv.id ?? inv.invite_id),
        teamId: String(inv.team_id),
        email: inv.invited_user_email ?? u.data.email,
        role: (inv.role?.toLowerCase() === "admin"
          ? "Admin"
          : inv.role?.toLowerCase() === "owner"
            ? "Owner"
            : "Member") as Member["role"],
        status: (inv.status === "pending" || !inv.status
          ? "Pending"
          : inv.status === "accepted"
            ? "Accepted"
            : "Rejected") as "Pending" | "Accepted" | "Rejected",
      }));

      setState({
        ...empty,
        teams,
        projects: rows(ps.data, "projects").map((p) => ({
          id: String(p.project_id ?? p.id),
          teamId: String(p.team_id),
          name: p.name,
          description: p.description ?? "",
          status: p.status ?? "Planning",
          startDate: p.start_date?.slice(0, 10) ?? "",
          dueDate: p.due_date?.slice(0, 10) ?? "",
          memberIds: p.member_ids?.map(String) ?? [],
          icon: "Layout",
        })),
        tasks: rows(tasks.data, "tasks").map(normalizeTask),
        activity,
        invitations,
      });
    } catch {
      setError(
        "Could not load your workspace. Check that the API is running and /projects is available.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);
  const event = (s: Workspace, text: string, projectId?: string) => ({
    ...s,
    activity: [
      { id: id(), text, date: new Date().toISOString(), read: false, projectId },
      ...s.activity,
    ],
  });
  const action = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (e) {
      toast.error(taskApiError(e).message);
      throw e;
    }
  };
  const value: Context = {
    state,
    user,
    demo,
    loading,
    error,
    activityError,
    reload,
    saveTeam: (team) =>
      action(async () => {
        const exists = state.teams.some((t) => t.id === team.id);
        if (!demo) {
          await (exists
            ? api.put(`/teams/${team.id}`, { name: team.name, description: team.description })
            : api.post("/teams", { name: team.name, description: team.description }));
          await reload();
        } else
          setState((s) =>
            event(
              {
                ...s,
                teams: exists
                  ? s.teams.map((t) => (t.id === team.id ? team : t))
                  : [...s.teams, team],
              },
              `${user.username} ${exists ? "updated" : "created"} ${team.name}`,
            ),
          );
        toast.success(exists ? "Team updated" : "Team created");
      }),
    saveProject: (project) =>
      action(async () => {
        const team = state.teams.find((t) => t.id === project.teamId);
        if (!team || project.memberIds.some((mid) => !team.members.some((m) => m.id === mid)))
          throw new Error("Project members must belong to the selected team.");
        const exists = state.projects.some((p) => p.id === project.id);
        if (!demo) {
          const payload = {
            name: project.name,
            description: project.description,
            team_id: project.teamId,
            status: project.status,
            start_date: project.startDate || null,
            due_date: project.dueDate || null,
            member_ids: project.memberIds,
          };
          await (exists
            ? api.put(`/projects/${project.id}`, payload)
            : api.post("/projects", payload));
          await reload();
        } else
          setState((s) =>
            event(
              {
                ...s,
                projects: exists
                  ? s.projects.map((p) => (p.id === project.id ? project : p))
                  : [...s.projects, project],
              },
              `${user.username} ${exists ? "updated" : "created"} ${project.name}`,
              project.id,
            ),
          );
        toast.success("Project saved");
      }),
    assignmentMembers: async (projectId) => {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) return [];
      if (demo) return state.teams.find(t => t.id === project.teamId)?.members ?? [];
      try {
        const [projectResponse, teamResponse] = await Promise.all([
          api.get(`/projects/${projectId}/members`),
          api.get(`/members/t/${project.teamId}`),
        ]);
        return mergeMembers(normalizeMembers(projectResponse.data), normalizeMembers(teamResponse.data));
      } catch (error) {
        const failure = taskApiError(error);
        if (failure.status === 401) void navigate({ to: "/login" });
        throw failure;
      }
    },
    saveTask: (task) =>
      action(async () => {
        const previous = state.tasks.find(t => t.id === task.id);
        const exists = Boolean(previous);
        if (!demo) {
          try {
            let taskId = task.id;
            if (exists) await api.put(`/tasks/${task.id}`, taskPayload(task, previous));
            else {
              const created = await api.post("/tasks/task", taskPayload(task));
              taskId = created.data.task_id ?? created.data.task?.id;
              if (!taskId) throw new Error("The server did not return the created task id.");
            }
            const response = await api.get(`/tasks/${taskId}`);
            const saved = normalizeTask(response.data.task);
            setState(s => ({ ...s, tasks: exists ? s.tasks.map(t => t.id === taskId ? saved : t) : [...s.tasks, saved] }));
          } catch (error) {
            const failure = taskApiError(error);
            if (failure.status === 401) void navigate({ to: "/login" });
            if (failure.status === 404 && exists) setState(s => ({ ...s, tasks: s.tasks.filter(t => t.id !== task.id) }));
            throw failure;
          }
        } else {
          const draft = { ...task, id: task.id || id(), creatorId: task.creatorId ?? user.user_id };
          validateAssignment(draft, state.projects, state.teams);
          const member = state.teams.flatMap(t => t.members).find(m => m.id === draft.assigneeId);
          const saved = { ...draft, assignee: member ? { id: member.id, name: member.name } : null };
          setState(s => event({ ...s, tasks: exists ? s.tasks.map(t => t.id === task.id ? saved : t) : [...s.tasks, saved] }, `${user.username} ${exists ? "updated" : "created"} ${task.title} · ${task.status}`, task.projectId));
        }
        toast.success("Task saved");
      }),
    remove: (kind, itemId) =>
      action(async () => {
        if (!demo) {
          await api.delete(`/${kind}/${itemId}`);
          await reload();
        } else
          setState((s) => ({
            ...s,
            [kind]: s[kind].filter((x) => x.id !== itemId),
            projects: kind === "teams" ? s.projects.filter((p) => p.teamId !== itemId) : s.projects,
            tasks:
              kind === "tasks"
                ? s.tasks.filter((t) => t.id !== itemId)
                : kind === "projects"
                  ? s.tasks.filter((t) => t.projectId !== itemId)
                  : s.tasks.filter(
                      (t) => !s.projects.some((p) => p.id === t.projectId && p.teamId === itemId),
                    ),
          }));
        toast.success("Deleted");
      }),
    invite: (teamId, email, role) =>
      action(async () => {
        if (
          state.teams
            .find((t) => t.id === teamId)
            ?.members.some((m) => m.email.toLowerCase() === email.toLowerCase())
        )
          throw new Error("This person is already a member.");
        if (!demo) {
          const users = rows(
            (await api.get("/members/search", { params: { q: email } })).data,
            "users",
          );
          const invited = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (!invited) throw new Error("No registered user found with this email.");
          await api.post("/invites/", {
            teamId,
            invitedUserId: invited.user_id,
            role: role.toLowerCase(),
            invitedBy: user.user_id,
          });
        }
        setState((s) => ({
          ...s,
          invitations: [...s.invitations, { id: id(), teamId, email, role, status: "Pending" }],
        }));
        toast.success("Invitation sent");
      }),
    respond: (inviteId) =>
      action(async () => {
        if (!demo) {
          await api.patch(`/invites/${inviteId}/respond`, { action: "accepted" });
          await reload();
        } else
          setState((s) =>
            acceptInvitation(s, inviteId, {
              id: user.user_id,
              name: user.username,
              email: user.email,
              role: "Member",
            }),
          );
        toast.success("Invitation accepted");
      }),
    member: (teamId, memberId, role) =>
      action(async () => {
        const target = state.teams
          .find((t) => t.id === teamId)
          ?.members.find((m) => m.id === memberId);
        if (target?.role === "Owner")
          throw new Error("The team owner cannot be removed or demoted.");
        if (!demo) {
          await (role
            ? api.put(`/members/${teamId}/${memberId}`, { role: role.toLowerCase() })
            : api.delete(`/members/${teamId}/${memberId}`));
          await reload();
        } else
          setState((s) => ({
            ...s,
            teams: s.teams.map((t) =>
              t.id === teamId
                ? {
                    ...t,
                    members: role
                      ? t.members.map((m) => (m.id === memberId ? { ...m, role } : m))
                      : t.members.filter((m) => m.id !== memberId),
                  }
                : t,
            ),
            projects: role
              ? s.projects
              : s.projects.map((p) =>
                  p.teamId === teamId
                    ? { ...p, memberIds: p.memberIds.filter((mid) => mid !== memberId) }
                    : p,
                ),
            tasks: role
              ? s.tasks
              : s.tasks.map((t) =>
                  s.projects.some((p) => p.id === t.projectId && p.teamId === teamId) &&
                  t.assigneeId === memberId
                    ? { ...t, assigneeId: "" }
                    : t,
                ),
          }));
        toast.success(role ? "Role updated" : "Member removed");
      }),
    markRead: () =>
      setState((s) => ({ ...s, activity: s.activity.map((a) => ({ ...a, read: true })) })),
    updateProfile: (name) =>
      action(async () => {
        // if (!demo) throw new Error("Profile updates are not available in this server version.");
        setUser((u) => ({ ...u, username: name }));
        toast.success("Profile updated");
      }),
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("WorkspaceProvider is required");
  return context;
}
