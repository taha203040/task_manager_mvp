import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Check, CheckCheck, ListChecks, Users, FolderKanban, UserCheck,
  MessagesSquare, LayoutGrid, ArrowRight, Sparkles, Zap, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tasky — Organize tasks, projects and teams in one place" },
      { name: "description", content: "Tasky helps teams plan projects, assign tasks and collaborate on a shared Kanban workspace." },
      { property: "og:title", content: "Tasky — Organize tasks, projects and teams" },
      { property: "og:description", content: "Plan projects, assign tasks and collaborate with your team in one workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

/* ---------------------------------- hooks --------------------------------- */

/** Reveals an element when it scrolls into view (one-shot). */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/** Types out a string character by character, then optionally loops through phrases. */
function useTypewriter(phrases: string[], speed = 70, pause = 1800) {
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === "") {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    } else {
      timeout = setTimeout(() => {
        setText(current.slice(0, text.length + (deleting ? -1 : 1)));
      }, deleting ? speed / 2 : speed);
    }
    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIndex, phrases, speed, pause]);

  return text;
}

/* -------------------------------- reveal --------------------------------- */

function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0px)" : `translateY(${y}px)`,
        transition: `opacity 700ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 700ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/* --------------------------------- data ---------------------------------- */

const features = [
  { icon: ListChecks, title: "Task Management", text: "Create tasks with priorities, due dates and statuses from Todo to Done." },
  { icon: Users, title: "Team Collaboration", text: "Invite teammates with Owner, Admin or Member roles." },
  { icon: FolderKanban, title: "Project Organization", text: "Group work into projects under each team and track progress." },
  { icon: UserCheck, title: "Task Assignments", text: "Assign work to project or team members so everyone knows what's next." },
  { icon: MessagesSquare, title: "Real-time Communication", text: "Stay in sync with an inbox of activity updates and invitations." },
  { icon: LayoutGrid, title: "Workspace Management", text: "One workspace for dashboards, boards, lists and settings." },
];

interface CardItem {
  id: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  avatarBg: string;
}
interface Column {
  name: string;
  dot: string;
  cards: CardItem[];
}

const initialColumns: Column[] = [
  {
    name: "Todo", dot: "bg-muted-foreground",
    cards: [
      { id: "1", title: "Write launch brief", priority: "High", avatarBg: "bg-indigo-500/20" },
      { id: "2", title: "Audit onboarding flow", priority: "Medium", avatarBg: "bg-blue-500/20" },
    ],
  },
  {
    name: "In Progress", dot: "bg-primary",
    cards: [
      { id: "3", title: "Kanban drag & drop", priority: "Urgent", avatarBg: "bg-rose-500/20" },
      { id: "4", title: "Team invite emails", priority: "High", avatarBg: "bg-amber-500/20" },
    ],
  },
  {
    name: "In Review", dot: "bg-teal",
    cards: [{ id: "5", title: "Dashboard metrics", priority: "Medium", avatarBg: "bg-teal-500/20" }],
  },
  {
    name: "Done", dot: "bg-teal",
    cards: [
      { id: "6", title: "Auth flow", priority: "Low", avatarBg: "bg-emerald-500/20" },
      { id: "7", title: "Project permissions", priority: "Low", avatarBg: "bg-purple-500/20" },
    ],
  },
];

/* --------------------------------- logo ---------------------------------- */

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
        <CheckCheck className="size-5" />
      </span>
      <span className="text-xl font-bold text-foreground">tasky<span className="text-primary">.</span></span>
    </Link>
  );
}

/* ------------------------------ board preview ---------------------------- */

function BoardPreview({ compact = false }: { compact?: boolean }) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);

  useEffect(() => {
    let step = 0;
    const tick = () => {
      step = (step + 1) % 4;
      if (step === 1) {
        setAnimatingCardId("3");
        setColumns((cols) => {
          const card = cols[1].cards.find((c) => c.id === "3");
          if (!card) return cols;
          return [
            cols[0],
            { ...cols[1], cards: cols[1].cards.filter((c) => c.id !== "3") },
            { ...cols[2], cards: [card, ...cols[2].cards] },
            cols[3],
          ];
        });
      } else if (step === 2) {
        setAnimatingCardId("2");
        setColumns((cols) => {
          const card = cols[0].cards.find((c) => c.id === "2");
          if (!card) return cols;
          return [
            { ...cols[0], cards: cols[0].cards.filter((c) => c.id !== "2") },
            { ...cols[1], cards: [...cols[1].cards, card] },
            cols[2],
            cols[3],
          ];
        });
      } else if (step === 3) {
        setAnimatingCardId("3");
        setJustDone("3");
        setColumns((cols) => {
          const card = cols[2].cards.find((c) => c.id === "3");
          if (!card) return cols;
          return [
            cols[0],
            cols[1],
            { ...cols[2], cards: cols[2].cards.filter((c) => c.id !== "3") },
            { ...cols[3], cards: [card, ...cols[3].cards] },
          ];
        });
        setTimeout(() => setJustDone(null), 1200);
      } else {
        setAnimatingCardId(null);
        setColumns(initialColumns);
      }
    };

    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card/95 shadow-2xl backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-indigo-500/20">
      {/* top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-border transition-colors duration-300 group-hover:bg-rose-400" />
          <span className="size-2.5 rounded-full bg-border transition-colors delay-75 duration-300 group-hover:bg-amber-400" />
          <span className="size-2.5 rounded-full bg-border transition-colors delay-150 duration-300 group-hover:bg-emerald-400" />
          <span className="ml-3 text-xs font-medium text-muted-foreground">Design team / Website relaunch</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Live preview
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className={`hidden w-44 shrink-0 space-y-1 border-r p-3 text-sm ${compact ? "" : "md:block"}`}>
          {["Overview", "My tasks", "Inbox", "Teams", "Projects"].map((label, i) => (
            <div
              key={label}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 transition-colors ${
                i === 4
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <span>{label}</span>
              {i === 4 && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
            </div>
          ))}
        </aside>

        {/* columns */}
        <div className={`grid flex-1 grid-cols-2 gap-3 overflow-hidden p-4 ${compact ? "" : "lg:grid-cols-4"}`}>
          {columns.map((column) => (
            <div
              key={column.name}
              className="flex flex-col space-y-2 rounded-xl bg-muted/50 p-2.5 transition-colors hover:bg-muted/70"
            >
              <div className="flex items-center gap-2 px-1 text-xs font-semibold">
                <span className={`size-2 rounded-full ${column.dot}`} />
                <span>{column.name}</span>
                <span className="ml-auto rounded-full bg-background px-1.5 text-[10px] font-normal text-muted-foreground shadow-sm">
                  {column.cards.length}
                </span>
              </div>

              <div className="min-h-[140px] space-y-2">
                {column.cards.map((card) => {
                  const isMoving = card.id === animatingCardId;
                  const isDone = column.name === "Done";
                  const showSparkle = card.id === justDone;

                  return (
                    <div
                      key={card.id}
                      className={`relative rounded-lg border bg-card p-2.5 text-left shadow-sm transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-md ${
                        isMoving ? "ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg" : ""
                      } ${isDone ? "border-teal/30 bg-teal/5" : ""}`}
                    >
                      {showSparkle && (
                        <Sparkles className="absolute -right-1.5 -top-1.5 size-4 animate-[ping_0.6s_ease-out_1] text-amber-400" />
                      )}
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-medium leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}>
                          {card.title}
                        </p>
                        {isDone && <Check className="size-3.5 shrink-0 text-teal" />}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                            card.priority === "Urgent" || card.priority === "High"
                              ? "bg-destructive/10 text-destructive"
                              : card.priority === "Medium"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {card.priority}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isMoving && !isDone && (
                            <span className="flex items-center text-[10px] font-medium text-primary animate-pulse">
                              Moved <ArrowRight className="ml-0.5 size-2.5" />
                            </span>
                          )}
                          <span className={`size-5 rounded-full ${card.avatarBg} ring-1 ring-border/50`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ auth buttons ----------------------------- */

function AuthButtons({ size = "lg" as const }: { size?: "lg" | "sm" }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button asChild size={size} className="group">
        <Link to="/signup">
          Get Started
          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Button>
      <Button asChild size={size} variant="outline"><Link to="/login">Sign In</Link></Button>
    </div>
  );
}

/* ------------------------------- marquee --------------------------------- */

function Marquee() {
  const items = ["Kanban boards", "Sprint planning", "Team inbox", "Task priorities", "Project roles", "Real-time sync", "Dashboards", "Due dates"];
  return (
    <div className="relative overflow-hidden border-y bg-card py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-8">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground">
            <Zap className="size-3.5 text-primary" /> {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ------------------------------ floating dots ---------------------------- */

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-20 top-10 size-72 rounded-full bg-primary/20 blur-3xl animate-[float_9s_ease-in-out_infinite]" />
      <div className="absolute -right-16 top-40 size-64 rounded-full bg-teal/20 blur-3xl animate-[float_11s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-0 left-1/3 size-56 rounded-full bg-indigo-400/20 blur-3xl animate-[float_13s_ease-in-out_infinite]" />
      <style>{`@keyframes float { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-30px) scale(1.1); } }`}</style>
    </div>
  );
}

/* -------------------------------- landing -------------------------------- */

function Landing() {
  const typed = useTypewriter(["together.", "faster.", "in sync.", "without chaos."]);

  return (
    <div className="landing min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <div className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="relative transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full">Features</a>
            <a href="#about" className="relative transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full">About</a>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">Sign In</Link></Button>
            <Button asChild size="sm"><Link to="/signup">Sign Up</Link></Button>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-24">
        <FloatingOrbs />

        <Reveal delay={0}>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-teal" />
            </span>
            Teams, projects and tasks in one place
          </span>
        </Reveal>
        {/* hero headline — reserve space so typing doesn't reflow */}
        <Reveal delay={80}>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Get your team's work done,{" "}
            <span className="relative inline-block text-primary">
              {/* invisible longest phrase reserves width + height */}
              <span aria-hidden className="invisible">without chaos.</span>
              {/* typed text overlays exactly on top */}
              <span className="absolute inset-0">
                {typed}
                <span className="ml-0.5 inline-block w-[3px] animate-pulse bg-primary align-middle" style={{ height: "0.9em" }} />
              </span>
            </span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Organize tasks, plan projects and collaborate with your team on a clear, shared board — so nothing slips.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-8"><AuthButtons /></div>
        </Reveal>

        <Reveal delay={340} y={40}>
          <div className="mt-14"><BoardPreview /></div>
        </Reveal>
      </section>

      <Marquee />

      {/* features */}
      <section id="features" className="scroll-mt-20 border-t bg-card py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Everything your team needs to ship</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60} y={30}>
                <div className="group h-full rounded-xl border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* product */}
      <section className="py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <Reveal y={24}>
            <div>
              <p className="text-sm font-semibold text-primary">Product</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">See every project at a glance</h2>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {["Kanban and list views for every project", "Teams own projects, projects own tasks", "Dashboard with priorities and team activity"].map((t, i) => (
                  <li key={t} className="flex gap-2 transition-transform duration-300 hover:translate-x-1" style={{ transitionDelay: `${i * 40}ms` }}>
                    <CheckCheck className="size-4 shrink-0 text-teal" />{t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120} y={40}>
            <BoardPreview compact />
          </Reveal>
        </div>
      </section>

      {/* how it works */}
      <section id="about" className="scroll-mt-20 border-t bg-card py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Up and running in three steps</h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["Create your workspace", "Sign up and set up a team for your group."],
              ["Organize projects and tasks", "Add projects, break them into tasks and set priorities."],
              ["Collaborate with your team", "Invite teammates, assign work and track progress."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 100} y={30}>
                <div className="group h-full rounded-xl border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">{i + 1}</span>
                  <h3 className="mt-4 font-semibold">{t}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6">
        <Reveal y={40}>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl bg-navy px-6 py-14 text-center">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="absolute -left-10 -top-10 size-48 rounded-full bg-primary/40 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
              <div className="absolute -bottom-10 -right-10 size-56 rounded-full bg-teal/40 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]" />
            </div>
            <h2 className="relative text-3xl font-bold tracking-tight text-primary-foreground">Start organizing your work today</h2>
            <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/70">Bring your team, projects and tasks together in minutes.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="group">
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary"><Link to="/login">Sign In</Link></Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">Task management for teams that want clarity.</p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#about" className="transition-colors hover:text-foreground">About</a>
            <Link to="/login" className="transition-colors hover:text-foreground">Sign In</Link>
            <Link to="/signup" className="transition-colors hover:text-foreground">Sign Up</Link>
          </div>
        </div>
        <p className="border-t py-5 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tasky. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
