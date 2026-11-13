import { PenTool, FileText, ClipboardList, CheckCircle2, FileEdit, Sparkles } from "lucide-react";

export function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* Subtle ambient gradients */}
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-indigo-500/5 blur-3xl" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.25] [radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Floating Badge 1: Top-Left (Pen) */}
      <div className="absolute top-12 left-8 md:top-24 md:left-24 animate-[bounce_8s_infinite_ease-in-out]">
        <div className="flex size-14 items-center justify-center rounded-full border border-indigo-200/50 bg-white/70 shadow-lg shadow-indigo-500/5 backdrop-blur-md dark:border-indigo-900/50 dark:bg-slate-900/70">
          <PenTool className="size-6 text-indigo-600 dark:text-indigo-400 rotate-12" />
        </div>
      </div>

      {/* Floating Badge 2: Top-Right (Paper Sheet) */}
      <div className="absolute top-16 right-8 md:top-20 md:right-28 animate-[bounce_9s_infinite_ease-in-out_1.5s]">
        <div className="flex size-16 items-center justify-center rounded-full border border-slate-200/60 bg-white/70 shadow-lg shadow-slate-500/5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
          <FileText className="size-7 text-slate-600 dark:text-slate-300 -rotate-12" />
        </div>
      </div>

      {/* Floating Badge 3: Bottom-Left (Clipboard with Task List) */}
      <div className="absolute bottom-16 left-10 md:bottom-28 md:left-32 animate-[bounce_7s_infinite_ease-in-out_2s]">
        <div className="flex size-16 items-center justify-center rounded-full border border-teal-200/50 bg-white/70 shadow-lg shadow-teal-500/5 backdrop-blur-md dark:border-teal-900/40 dark:bg-slate-900/70">
          <ClipboardList className="size-7 text-teal-600 dark:text-teal-400 rotate-6" />
        </div>
      </div>

      {/* Floating Badge 4: Bottom-Right (Pencil / Edit) */}
      <div className="absolute bottom-20 right-10 md:bottom-32 md:right-32 animate-[bounce_8.5s_infinite_ease-in-out_0.5s]">
        <div className="flex size-14 items-center justify-center rounded-full border border-indigo-200/50 bg-white/70 shadow-lg shadow-indigo-500/5 backdrop-blur-md dark:border-indigo-900/50 dark:bg-slate-900/70">
          <FileEdit className="size-6 text-indigo-500 dark:text-indigo-400 -rotate-6" />
        </div>
      </div>

      {/* Floating Badge 5: Mid-Left Tiny (Checkmark Task) */}
      <div className="hidden lg:flex absolute top-1/2 left-12 -translate-y-12 animate-[pulse_4s_infinite]">
        <div className="flex size-11 items-center justify-center rounded-full border border-emerald-200/40 bg-white/60 shadow-md backdrop-blur-sm dark:border-emerald-900/30 dark:bg-slate-900/60">
          <CheckCircle2 className="size-5 text-emerald-500" />
        </div>
      </div>

      {/* Floating Badge 6: Mid-Right Tiny (Sparkle) */}
      <div className="hidden lg:flex absolute top-1/2 right-16 -translate-y-6 animate-[pulse_5s_infinite_1s]">
        <div className="flex size-11 items-center justify-center rounded-full border border-amber-200/40 bg-white/60 shadow-md backdrop-blur-sm dark:border-amber-900/30 dark:bg-slate-900/60">
          <Sparkles className="size-5 text-amber-500" />
        </div>
      </div>
    </div>
  );
}
