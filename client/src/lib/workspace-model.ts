export type Member = { id: string; name: string; email: string; role: "Owner" | "Admin" | "Member" };
export type Team = { id: string; name: string; description: string; avatar: string; members: Member[] };
export const projectStatuses = ["Planning", "Active", "On Hold", "Completed", "Archived"] as const;
export const taskStatuses = ["Todo", "In Progress", "In Review", "Done"] as const;
export const priorities = ["Low", "Medium", "High", "Urgent"] as const;
export type Project = { id: string; teamId: string; name: string; description: string; status: typeof projectStatuses[number]; startDate: string; dueDate: string; memberIds: string[]; icon: string };
export type Comment = { id: string; author: string; text: string; date: string };
export type Task = { id: string; projectId: string; creatorId?: string; title: string; description: string; assigneeId: string; assignee?: { id: string; name: string; avatar?: string } | null; status: typeof taskStatuses[number]; priority: typeof priorities[number]; dueDate: string; labels: string[]; createdAt: string; comments: Comment[]; attachments: { name: string; url: string }[] };
export type Activity = { id: string; text: string; date: string; projectId?: string; read: boolean };
export type Invitation = { id: string; teamId: string; email: string; role: Member["role"]; status: "Pending" | "Accepted" | "Rejected" };
export type Workspace = { teams: Team[]; projects: Project[]; tasks: Task[]; activity: Activity[]; invitations: Invitation[] };
export const currentUserId = "mock-user-1";
export function projectProgress(projectId: string, tasks: Task[]) {
  const items = tasks.filter(t => t.projectId === projectId);
  return items.length ? Math.round(items.filter(t => t.status === "Done").length / items.length * 100) : 0;
}
export function validateAssignment(task: Pick<Task, "projectId" | "assigneeId" | "creatorId">, projects: Project[], teams: Team[] = []) {
  if (!task.projectId) {
    if (task.assigneeId && task.assigneeId !== task.creatorId) throw new Error("A task without a project can only be assigned to its creator.");
    return;
  }
  const project = projects.find(p => p.id === task.projectId);
  if (!project) throw new Error("Select an existing project.");
  if (task.assigneeId && !project.memberIds.includes(task.assigneeId) && !teams.find(t => t.id === project.teamId)?.members.some(m => m.id === task.assigneeId)) throw new Error("Assignee must be a project or team member.");
}
export function acceptInvitation(state: Workspace, invitationId: string, member: Member): Workspace {
  const invitation = state.invitations.find(i => i.id === invitationId && i.status === "Pending");
  if (!invitation || invitation.email.toLowerCase() !== member.email.toLowerCase()) throw new Error("This invitation is not addressed to you.");
  return { ...state, invitations: state.invitations.map(i => i.id === invitationId ? { ...i, status: "Accepted" } : i), teams: state.teams.map(t => t.id === invitation.teamId ? { ...t, members: t.members.some(m => m.id === member.id) ? t.members : [...t.members, { ...member, role: invitation.role }] } : t) };
}
