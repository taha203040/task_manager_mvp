import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeActivity } from "./activity-adapter";

test("activity endpoint rows map to workspace activity", () => {
  assert.deepEqual(normalizeActivity({ activity: [{ activity_id: 7, message: "Task completed", created_at: "2026-11-08T10:03:00Z", project_id: 3, is_read: false }] }), [
    { id: "7", text: "Task completed", date: "2026-11-08T10:03:00Z", projectId: "3", read: false },
  ]);
});
test("bare activity arrays preserve read state", () => {
  assert.equal(normalizeActivity([{ id: "a1", text: "Update", date: "2026-11-08T10:03:00Z", read: true }])[0]?.read, true);
});
test("empty activity is valid but malformed responses are not empty feeds", () => {
  assert.deepEqual(normalizeActivity({ activities: [] }), []);
  assert.throws(() => normalizeActivity({ message: "Unavailable" }));
  assert.throws(() => normalizeActivity([{ id: 1, text: "Update", date: "invalid" }]));
});