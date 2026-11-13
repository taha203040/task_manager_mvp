import { UserRound } from "lucide-react";
import type { Task } from "@/lib/workspace-model";
import { Avatar } from "./shell";

export function TaskAssignee({ task }: { task: Task }) {
  const person = task.assignee;
  if (!person) return <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><UserRound className="size-3" />Unassigned</span>;
  return <span className="flex min-w-0 items-center gap-2" title={person.name}>
    {person.avatar ? <img src={person.avatar} alt={person.name} className="size-7 shrink-0 rounded-full object-cover" /> : <Avatar name={person.name} small />}
    <span className="truncate text-[10px] text-muted-foreground">{person.name}</span>
  </span>;
}