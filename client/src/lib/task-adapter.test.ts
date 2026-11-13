import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTask, normalizeMembers, taskPayload, mergeMembers, taskApiError } from "./task-adapter";
import { validateAssignment, type Project, type Team } from "./workspace-model";
const fixture = () => ({ projects: [{ id: "website", teamId: "design", memberIds: ["a"] } as Project], teams: [{ id: "design", members: [{ id: "maya" }] } as Team] });

const task = normalizeTask({ id: "server-id", title: "Fix login", user_id: "creator", assignee_id: null, assignee: null });
test("null assignment does not fall back to the creator", () => {
  assert.equal(task.assigneeId, "");
  assert.equal(task.assignee, null);
});
test("resolved assignee comes directly from the task response", () => {
  const result = normalizeTask({ task_id: "created-id", title: "Fix login", assignee_id: "user-1", assignee: { user_id: "user-1", username: "Alex", avatar: "/alex.png" } });
  assert.equal(result.id, "created-id");
  assert.deepEqual(result.assignee, { id: "user-1", name: "Alex", avatar: "/alex.png" });
});
test("candidate ids are user ids, not membership ids", () => {
  const result = normalizeMembers({ members: [{ id: "membership-1", user_id: "user-1", username: "Alex", role: null }] });
  assert.equal(result[0]?.id, "user-1");
});
test("bare team members and project members merge by user id", () => {
  const project = normalizeMembers({ members: [{ user_id: "user-1", username: "Alex" }] });
  const team = normalizeMembers([{ user_id: "user-1", username: "Alex" }, { user_id: "user-2", username: "Sam" }]);
  assert.deepEqual(mergeMembers(project, team).map(m => m.id), ["user-1", "user-2"]);
});
test("assignment sends the bare assignee_id and no client-generated task id", () => {
  const payload = taskPayload({ ...task, id: "draft-id", assigneeId: "user-1" });
  assert.equal(payload.assignee_id, "user-1");
  assert.equal("id" in payload, false);
  assert.equal("assignee" in payload, false);
});
test("unchanged assignment is omitted for updates", () => {
  assert.equal("assignee_id" in taskPayload({ ...task, status: "Done" }, task), false);
});
test("unassigning sends an explicit null", () => {
  assert.equal(taskPayload(task, { ...task, assigneeId: "user-1" }).assignee_id, null);
});
test("demo assignment allows team members outside the project", () => {
  const state = fixture();
  assert.doesNotThrow(() => validateAssignment({ projectId: "website", assigneeId: "maya" }, state.projects, state.teams));
});
test("demo assignment rejects a user outside both project and team", () => {
  const state = fixture();
  assert.throws(() => validateAssignment({ projectId: "website", assigneeId: "outsider" }, state.projects, state.teams));
});
test("a projectless task can only be assigned to its creator", () => {
  assert.doesNotThrow(() => validateAssignment({ projectId: "", assigneeId: "creator", creatorId: "creator" }, []));
  assert.throws(() => validateAssignment({ projectId: "", assigneeId: "other", creatorId: "creator" }, []));
});
test("assignment errors preserve server status and message", () => {
  const error = taskApiError({ isAxiosError: true, response: { status: 403, data: { message: "Task not editable" } } });
  assert.equal(error.status, 403);
  assert.equal(error.message, "Task not editable");
});