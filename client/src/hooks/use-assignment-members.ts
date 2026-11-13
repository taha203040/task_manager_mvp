import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/components/workspace/provider";
import { taskApiError } from "@/lib/task-adapter";
import type { Member } from "@/lib/workspace-model";

export function useAssignmentMembers(projectId?: string) {
  const { assignmentMembers, demo } = useWorkspace();
  const load = useRef(assignmentMembers);
  load.current = assignmentMembers;
  const [result, setResult] = useState<{ projectId?: string; members: Member[]; loading: boolean; error: string }>({ members: [], loading: false, error: "" });
  useEffect(() => {
    let active = true;
    if (!projectId) { setResult({ projectId, members: [], loading: false, error: "" }); return; }
    setResult({ projectId, members: [], loading: true, error: "" });
    void load.current(projectId).then(members => {
      if (active) setResult({ projectId, members, loading: false, error: "" });
    }).catch(error => {
      if (active) setResult({ projectId, members: [], loading: false, error: taskApiError(error).message });
    });
    return () => { active = false; };
  }, [projectId, demo]);
  return result.projectId === projectId ? result : { members: [], loading: Boolean(projectId), error: "" };
}