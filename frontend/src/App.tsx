import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  authApi,
  practiceApi,
  evaluationApi,
  historyApi,
  hasToken,
  type UserOut,
  type QuestionOut,
  type EvaluationOut,
  type DashboardSummary,
  type AnswerHistoryEntry,
  type TopicCoverageOut,
} from "./api";

type Screen = "landing" | "dashboard" | "practice" | "resume" | "history";
type PracticeStep = 1 | 2 | 3;

// ── Subject & Curriculum Configuration ──────────────────────────────────────────
export interface SubjectConfig {
  key: string;
  name: string;
  abbr: string;
  tone: string;
  badgeTone: string;
  topics: string[];
}

export const SUBJECT_MAP: Record<string, SubjectConfig> = {
  dbms: {
    key: "dbms",
    name: "Database Management Systems",
    abbr: "DBMS",
    tone: "bg-[#4169e1]",
    badgeTone: "bg-[#e9edff] text-[#4169e1]",
    topics: ["Normalization", "Transactions & ACID", "Indexing", "Joins", "Concurrency Control"],
  },
  dsa: {
    key: "dsa",
    name: "Data Structures & Algorithms",
    abbr: "DSA",
    tone: "bg-[#ff6b4a]",
    badgeTone: "bg-[#fff0ec] text-[#e24b2e]",
    topics: ["Complexity Analysis", "Trees", "Graphs", "Sorting & Searching", "Dynamic Programming"],
  },
  os: {
    key: "os",
    name: "Operating Systems",
    abbr: "OS",
    tone: "bg-[#f3b83f]",
    badgeTone: "bg-[#fff8e6] text-[#b88314]",
    topics: ["Processes & Threads", "Memory Management", "CPU Scheduling", "Deadlocks", "Virtual Memory"],
  },
  cn: {
    key: "cn",
    name: "Computer Networks",
    abbr: "CN",
    tone: "bg-[#60b89a]",
    badgeTone: "bg-[#eaf7f2] text-[#2c7a60]",
    topics: ["OSI & TCP/IP", "IP Addressing", "Routing Protocols", "HTTP & DNS", "Sockets"],
  },
  oop: {
    key: "oop",
    name: "Object-Oriented Programming",
    abbr: "OOP",
    tone: "bg-[#9e78d2]",
    badgeTone: "bg-[#f5effe] text-[#7143b3]",
    topics: ["Polymorphism", "Inheritance", "Encapsulation", "Abstraction", "Design Principles"],
  },
};

const COMPANY_TRACKS = [
  { id: "product_based", label: "Product based" },
  { id: "mass_recruiter_it", label: "Mass recruiter IT" },
  { id: "fintech_core", label: "Fintech core" },
];

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

// ── Icons ──────────────────────────────────────────────────────────────────────
const iconPaths: Record<string, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  eye: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><path d="M2 2l20 20"/></>,
  spark: <path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2ZM5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8L5 17Z" />,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 15v5h16v-5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M18 12H8" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  loader: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>,
  award: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
};

function Icon({ name, size = 19, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {iconPaths[name]}
    </svg>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "dark" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-[#ff5b39] text-white hover:bg-[#e94b2b] shadow-[0_3px_0_#bd3218] disabled:opacity-60 disabled:hover:bg-[#ff5b39]",
    outline: "border border-[#cdc8bc] bg-white text-[#181a1b] hover:border-[#181a1b] disabled:opacity-50",
    dark: "bg-[#17201f] text-white hover:bg-black disabled:opacity-50",
    ghost: "text-[#5e625f] hover:bg-black/5 disabled:opacity-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all active:translate-y-px cursor-pointer disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Mark({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 rotate-3 place-items-center rounded-md bg-[#ff5b39] text-sm font-black text-white shadow-[3px_3px_0_#f5ba3c]">
        P
      </div>
      <span className={`text-[15px] font-extrabold tracking-[-.02em] ${dark ? "text-white" : "text-[#16201f]"}`}>
        Placement Prep <span className="text-[#ff5b39]">AI</span>
      </span>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#ff5b39]">{eyebrow}</div>
        <h2 className="mt-1 text-xl font-extrabold tracking-[-.025em]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[] | string[];
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="field appearance-none pr-10 font-semibold"
        >
          {options.map((item) => {
            const optVal = typeof item === "string" ? item : item.value;
            const optLabel = typeof item === "string" ? item : item.label;
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>
        <Icon name="chevron" size={16} className="pointer-events-none absolute right-3 top-3.5 text-[#777]" />
      </div>
    </label>
  );
}

// ── Landing Page ───────────────────────────────────────────────────────────────
function Landing({ onEnter, onSignIn }: { onEnter: () => void; onSignIn: () => void }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f3eb] text-[#17201f]">
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-6 py-6 lg:px-8">
        <Mark />
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onSignIn}>Sign in</Button>
          <Button onClick={onEnter}>
            Create account <Icon name="arrow" size={16} />
          </Button>
        </div>
      </header>
      <main>
        <section className="relative mx-auto grid max-w-[1240px] gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pt-24">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d5d0c4] bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#5d625f]">
              <span className="h-2 w-2 rounded-full bg-[#60b89a]"></span> Built for engineering placements
            </div>
            <h1 className="max-w-3xl text-[clamp(3.6rem,7vw,6.7rem)] font-black leading-[.86] tracking-[-.075em]">
              Know it.<br />
              <span className="text-[#4169e1]">Say it.</span><br />
              Get placed.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#5c625f]">
              AI-powered technical interviews that test how well you understand core CS — not just how many problems you memorized.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button onClick={onEnter} className="px-6 py-3.5 text-base">
                Start preparing free <Icon name="arrow" />
              </Button>
              <span className="ml-2 font-mono text-xs text-[#747872]">UNLIMITED PRACTICE · 5 CORE SUBJECTS</span>
            </div>
            <div className="mt-14 flex flex-wrap gap-2">
              {Object.values(SUBJECT_MAP).map((sub, idx) => (
                <span
                  key={sub.key}
                  className={`rounded-md px-3 py-2 font-mono text-xs font-bold ${
                    idx === 0 ? "bg-[#17201f] text-white" : "border border-[#d2cdc2] bg-white"
                  }`}
                >
                  {sub.abbr}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex min-h-[480px] items-center justify-center">
            <div className="absolute right-0 top-4 h-72 w-72 rounded-full bg-[#f3b83f] opacity-80 blur-[1px]"></div>
            <div className="absolute bottom-0 left-2 h-56 w-56 rounded-full bg-[#4169e1] opacity-90"></div>
            <div className="relative w-full max-w-[460px] -rotate-2 rounded-2xl border border-black/10 bg-white p-5 shadow-[14px_18px_0_rgba(23,32,31,.9)]">
              <div className="flex items-center justify-between border-b border-[#e5e0d7] pb-4">
                <span className="font-mono text-xs font-bold text-[#4169e1]">LIVE INTERVIEW · DBMS</span>
                <span className="rounded-full bg-[#fff0ec] px-2.5 py-1 font-mono text-[10px] font-bold text-[#e24b2e]">02:48</span>
              </div>
              <p className="mt-5 text-xl font-extrabold leading-snug tracking-[-.025em]">
                How does a database recover from a transaction failure while preserving atomicity?
              </p>
              <div className="my-6 h-28 rounded-lg border border-dashed border-[#c9c4ba] bg-[#faf9f5] p-3 text-sm leading-6 text-[#767973]">
                Your conceptual explanation goes here...
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["Correctness", "8"],
                  ["Completeness", "7"],
                  ["Clarity", "9"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#f3f0e8] p-3">
                    <div className="font-mono text-[9px] uppercase text-[#797b76]">{label}</div>
                    <div className="mt-1 text-2xl font-black">
                      {value}<span className="text-xs text-[#999]">/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-[#d8d2c6] bg-white">
          <div className="mx-auto grid max-w-[1240px] md:grid-cols-3">
            {[
              ["01", "Syllabus-grounded", "Every question is generated from standard core textbook material, not a static question bank."],
              ["02", "Strict 30-point rubric", "Get scored on correctness, completeness, and clarity — without polite fluff."],
              ["03", "Know your exact gaps", "Turn weak subtopics into a precise, actionable preparation plan."],
            ].map(([num, title, body]) => (
              <div key={num} className="border-b border-[#ded9cf] p-8 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 lg:p-11">
                <span className="font-mono text-xs font-bold text-[#ff5b39]">{num}</span>
                <h3 className="mt-6 text-xl font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6d716d]">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// ── Auth Modal ─────────────────────────────────────────────────────────────────
function AuthModal({
  onClose,
  onSuccess,
  initialMode = "signin",
}: {
  onClose: () => void;
  onSuccess: (user: UserOut) => void;
  initialMode?: "signin" | "signup";
}) {
  const [signup, setSignup] = useState(initialMode === "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (signup) {
        if (!name.trim()) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }
        await authApi.register({ email: email.trim(), password, name: name.trim() });
        const user = await authApi.login({ email: email.trim(), password });
        onSuccess(user);
      } else {
        const user = await authApi.login({ email: email.trim(), password });
        onSuccess(user);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Authentication failed. Please check credentials.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#101615]/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#f8f6f0] p-7 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-md p-2 hover:bg-black/5" aria-label="Close modal">
          <Icon name="x" />
        </button>
        <Mark />
        <h2 className="mt-8 text-3xl font-black tracking-tight">{signup ? "Create your account" : "Welcome back"}</h2>
        <p className="mt-2 text-sm text-[#6b706c]">
          {signup ? "Start diagnosing your interview readiness." : "Continue your placement preparation."}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24]">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {signup && (
            <label className="block">
              <span className="field-label">Full name</span>
              <input
                className="field"
                placeholder="e.g. Arjun Mehta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}
          <label className="block">
            <span className="field-label">Email address</span>
            <input
              type="email"
              className="field"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="field-label">Password</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="field pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-[#777] hover:text-[#181a1b] transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={16} />
              </button>
            </div>
          </label>
          <Button type="submit" disabled={loading} className="mt-2 w-full py-3">
            {loading ? "Processing..." : signup ? "Create account" : "Sign in"}
            {!loading && <Icon name="arrow" size={17} />}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[#727671]">
          {signup ? "Already have an account?" : "New to Placement Prep AI?"}{" "}
          <button
            type="button"
            className="font-bold text-[#4169e1] hover:underline"
            onClick={() => {
              setSignup(!signup);
              setError(null);
            }}
          >
            {signup ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Application Shell ──────────────────────────────────────────────────────────
function Shell({
  screen,
  setScreen,
  children,
  onProfile,
  user,
}: {
  screen: Screen;
  setScreen: (s: Screen) => void;
  children: ReactNode;
  onProfile: () => void;
  user: UserOut | null;
}) {
  const [mobileNav, setMobileNav] = useState(false);
  const nav = [
    ["dashboard", "grid", "Dashboard"],
    ["practice", "mic", "Mock interview"],
    ["resume", "file", "Resume match"],
    ["history", "clock", "Session history"],
  ] as const;

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AM";

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#18201f]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col bg-[#17201f] p-5 text-white transition-transform lg:translate-x-0 ${
          mobileNav ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Mark dark />
        <nav className="mt-12 space-y-1.5">
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              onClick={() => {
                setScreen(id);
                setMobileNav(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
                screen === id ? "bg-white text-[#17201f]" : "text-[#aeb8b4] hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon name={icon} size={18} />
              {label}
              {id === "resume" && (
                <span className="ml-auto rounded bg-[#f3b83f] px-1.5 py-0.5 text-[8px] font-black text-[#17201f]">
                  NEW
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[.04] p-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#aab3af]">
              <span>Active Subject Core</span>
              <span>5 / 5</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full rounded-full bg-[#ff5b39]"></div>
            </div>
          </div>
          <button
            onClick={onProfile}
            className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/5"
          >
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#4169e1] text-xs font-extrabold text-white">
              {initials}
            </div>
            <div className="overflow-hidden">
              <div className="truncate text-sm font-bold">{user?.name || "Student"}</div>
              <div className="truncate text-[11px] text-[#8e9a95]">{user?.email || "Engineering"}</div>
            </div>
            <Icon name="chevron" size={16} className="ml-auto text-[#8e9a95]" />
          </button>
        </div>
      </aside>

      <div className="lg:pl-[244px]">
        <header className="flex h-16 items-center justify-between border-b border-[#dcd8cf] bg-[#f5f3ed]/90 px-5 backdrop-blur lg:px-9">
          <button className="lg:hidden" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle Navigation">
            <Icon name="menu" />
          </button>
          <div className="hidden items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.13em] text-[#747975] lg:flex">
            <span className="h-2 w-2 rounded-full bg-[#60b89a]"></span> FastAPI backend operational
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-xs font-semibold text-[#757975] sm:block">
              {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <div className="h-5 w-px bg-[#d0ccc3]"></div>
            <button
              onClick={onProfile}
              className="grid h-8 w-8 place-items-center rounded-full border border-[#d4d0c7] bg-white text-xs font-bold hover:border-[#4169e1]"
            >
              {initials}
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1420px] p-5 lg:p-9">{children}</main>
      </div>
      {mobileNav && (
        <button
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileNav(false)}
          aria-label="Close menu"
        ></button>
      )}
    </div>
  );
}

// ── Dashboard Component ────────────────────────────────────────────────────────
function Dashboard({
  user,
  goPractice,
  goResume,
  goHistory,
}: {
  user: UserOut | null;
  goPractice: (subject?: string, topic?: string) => void;
  goResume: () => void;
  goHistory: () => void;
}) {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [coverageData, setCoverageData] = useState<TopicCoverageOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [dash, cov] = await Promise.all([
          historyApi.getDashboard().catch(() => null),
          practiceApi.getCoverage().catch(() => []),
        ]);
        if (isMounted) {
          if (dash) setDashboardData(dash);
          if (cov) setCoverageData(cov);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute subject readiness stats merging API data + defaults
  const subjectReadiness = useMemo(() => {
    return Object.values(SUBJECT_MAP).map((sub) => {
      const summary = dashboardData?.subject_scores.find(
        (s) => s.subject.toLowerCase() === sub.key.toLowerCase()
      );
      const attempts = summary?.total_attempts || 0;
      const avgScore = summary ? Math.round(summary.avg_overall) : 0;
      // Readiness percentage based on attempts and avg score
      const readinessPercent = attempts > 0 ? Math.min(100, Math.round((avgScore / 30) * 100)) : 0;

      return {
        key: sub.key,
        subject: sub.name,
        abbr: sub.abbr,
        progress: readinessPercent,
        score: avgScore,
        attempts,
        tone: sub.tone,
      };
    });
  }, [dashboardData]);

  // Pick up where left off: latest weak topic or default to DBMS
  const nextTarget = useMemo(() => {
    if (dashboardData?.weak_topics && dashboardData.weak_topics.length > 0) {
      const wt = dashboardData.weak_topics[0];
      const sub = SUBJECT_MAP[wt.subject.toLowerCase()] || SUBJECT_MAP.dbms;
      return {
        subjectKey: sub.key,
        subjectName: sub.abbr,
        topic: wt.topic,
        subtitle: `Average score: ${Math.round(wt.avg_score)}/30 · Needs revision`,
      };
    }
    return {
      subjectKey: "dbms",
      subjectName: "DBMS",
      topic: "Normalization",
      subtitle: "Recommended starting point · Core placement concept",
    };
  }, [dashboardData]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-sm text-[#727672]">
            Welcome back, <span className="font-bold text-[#18201f]">{user?.name || "Student"}</span>.
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-[-.045em] md:text-5xl">Ready to get sharper?</h1>
          <p className="mt-3 text-sm text-[#6e736f]">
            {dashboardData?.total_evaluations
              ? `${dashboardData.total_evaluations} evaluations completed across 5 subjects`
              : "Start a mock interview session to evaluate your core CS depth"}
          </p>
        </div>
        <Button onClick={() => goPractice()} className="px-5 py-3">
          <Icon name="mic" size={17} /> Start mock interview
        </Button>
      </div>

      {/* Hero resume banner */}
      <button
        onClick={() => goPractice(nextTarget.subjectKey, nextTarget.topic)}
        className="group mt-9 flex w-full flex-col justify-between gap-5 overflow-hidden rounded-xl bg-[#4169e1] p-6 text-left text-white shadow-[0_4px_0_#274bb7] sm:flex-row sm:items-center lg:p-7"
      >
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white/15">
            <Icon name="arrow" className="-rotate-45" />
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-white/65">
              Pick up where you left off
            </div>
            <h3 className="mt-2 text-xl font-extrabold">
              {nextTarget.subjectName} — {nextTarget.topic}
            </h3>
            <p className="mt-1 text-sm text-white/70">{nextTarget.subtitle}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          Continue practice <Icon name="arrow" className="transition group-hover:translate-x-1" />
        </span>
      </button>

      {/* Grid: Core Curriculum vs How It Works */}
      <div className="mt-10 grid gap-8 xl:grid-cols-[1.45fr_.75fr]">
        <section>
          <SectionTitle
            eyebrow="Core curriculum"
            title="Subject readiness"
            action={<span className="font-mono text-[10px] text-[#777b77]">5 SUBJECTS</span>}
          />
          <div className="overflow-hidden rounded-xl border border-[#d9d5cc] bg-white">
            <div className="hidden grid-cols-[1.8fr_1fr_.7fr_.5fr] border-b border-[#e2ded5] bg-[#f1eee7] px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-wider text-[#777b77] sm:grid">
              <span>Subject</span>
              <span>Readiness</span>
              <span>Avg score</span>
              <span></span>
            </div>
            {subjectReadiness.map((item) => (
              <div
                key={item.abbr}
                className="grid items-center gap-4 border-b border-[#e7e3db] px-4 py-4 last:border-b-0 sm:grid-cols-[1.8fr_1fr_.7fr_.5fr] sm:px-5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-9 w-11 shrink-0 place-items-center rounded-md ${item.tone} font-mono text-[10px] font-black text-white`}
                  >
                    {item.abbr}
                  </div>
                  <div>
                    <div className="text-sm font-bold">{item.subject}</div>
                    <div className="text-[11px] text-[#777]">
                      {item.attempts} {item.attempts === 1 ? "attempt" : "attempts"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7e5df]">
                    <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.progress}%` }}></div>
                  </div>
                  <span className="w-8 font-mono text-[10px] font-bold">{item.progress}%</span>
                </div>
                <div className="text-sm font-extrabold">
                  {item.score}
                  <span className="text-xs font-medium text-[#92948f]"> / 30</span>
                </div>
                <button
                  onClick={() => goPractice(item.key)}
                  className="justify-self-start text-xs font-bold text-[#4169e1] hover:underline sm:justify-self-end"
                >
                  Practice →
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle eyebrow="How it works" title="Your session flow" />
          <div className="rounded-xl border border-[#d9d5cc] bg-[#17201f] p-6 text-white">
            {[
              ["01", "Configure", "Pick a core subject, topic & company track."],
              ["02", "Interview", "Answer a timed, syllabus-grounded question."],
              ["03", "Evaluate", "Get your rubric score (Correctness, Completeness, Clarity) & exact gaps."],
            ].map(([num, title, body], i) => (
              <div key={num} className="relative flex gap-4 pb-7 last:pb-0">
                {i < 2 && <div className="absolute left-[14px] top-8 h-[calc(100%-25px)] w-px bg-white/15"></div>}
                <div
                  className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[9px] font-black ${
                    i === 0 ? "bg-[#ff5b39]" : "border border-white/20 bg-[#26312f] text-[#929d99]"
                  }`}
                >
                  {num}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{title}</h4>
                  <p className="mt-1 text-xs leading-5 text-[#97a29e]">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={goResume}
              className="rounded-xl border border-[#d9d5cc] bg-white p-4 text-left transition hover:border-[#4169e1]"
            >
              <Icon name="file" className="text-[#4169e1]" />
              <div className="mt-4 text-sm font-bold">Resume match</div>
              <div className="mt-1 text-[11px] text-[#858984]">Find skill gaps</div>
            </button>
            <button
              onClick={goHistory}
              className="rounded-xl border border-[#d9d5cc] bg-white p-4 text-left transition hover:border-[#4169e1]"
            >
              <Icon name="clock" className="text-[#ff5b39]" />
              <div className="mt-4 text-sm font-bold">Past sessions</div>
              <div className="mt-1 text-[11px] text-[#858984]">Track progress</div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Practice Header ────────────────────────────────────────────────────────────
function PracticeHeader({ step }: { step: PracticeStep }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#737772]">Mock interview</p>
          <h2 className="text-2xl font-black">
            {step === 1 ? "Configure session" : step === 2 ? "Live technical question" : "Rubric evaluation & feedback"}
          </h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 rounded-full transition-all ${
                n === step ? "w-8 bg-[#ff5b39]" : n < step ? "w-2 bg-[#60b89a]" : "w-2 bg-[#d0ccc3]"
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Practice Flow Component ───────────────────────────────────────────────────
function Practice({
  initialSubject = "dbms",
  initialTopic,
  exit,
}: {
  initialSubject?: string;
  initialTopic?: string;
  exit: () => void;
}) {
  const normSubject = initialSubject.toLowerCase() in SUBJECT_MAP ? initialSubject.toLowerCase() : "dbms";
  const [step, setStep] = useState<PracticeStep>(1);

  // Configuration state
  const [selectedSubject, setSelectedSubject] = useState<string>(normSubject);
  const currentSubjectObj = SUBJECT_MAP[selectedSubject] || SUBJECT_MAP.dbms;
  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialTopic && currentSubjectObj.topics.includes(initialTopic) ? initialTopic : currentSubjectObj.topics[0]
  );
  const [selectedCompany, setSelectedCompany] = useState<string>("product_based");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");

  // Question & Answer state
  const [question, setQuestion] = useState<QuestionOut | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationOut | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(180);
  const [hint, setHint] = useState(false);

  // Timer effect for step 2
  useEffect(() => {
    if (step !== 2 || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(timer);
  }, [step, seconds]);

  // Handle Generate Question
  const handleGenerateQuestion = async () => {
    setError(null);
    setLoading(true);
    try {
      const generated = await practiceApi.generateQuestion({
        subject: selectedSubject,
        topic: selectedTopic,
        company_type: selectedCompany,
        difficulty_tag: selectedDifficulty,
        generation_method: "rag_generated",
      });
      setQuestion(generated);
      setAnswerText("");
      setHint(false);
      setSeconds(180);
      setStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to generate question. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  // Handle Submit Answer
  const handleSubmitAnswer = async () => {
    if (!question) return;
    if (!answerText.trim()) {
      setError("Please write an answer before submitting.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // 1. Submit answer
      const answerOut = await practiceApi.submitAnswer(question.id, answerText.trim());
      // 2. Evaluate answer
      const evalOut = await evaluationApi.evaluate(answerOut.id);
      setEvaluation(evalOut);
      setStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to submit and evaluate answer.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  // Step 1: Configure
  if (step === 1) {
    return (
      <div className="mx-auto max-w-4xl">
        <PracticeHeader step={step} />
        <div className="mt-8 rounded-2xl border border-[#d8d4ca] bg-white p-6 md:p-9">
          <div className="mb-8">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#ff5b39]">
              Step 01 · Configure
            </span>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Build your interview</h1>
            <p className="mt-2 text-sm text-[#737772]">
              We’ll retrieve relevant core syllabus material and generate a targeted interview question.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24]">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <SelectField
              label="Core subject"
              value={selectedSubject}
              onChange={(val) => {
                setSelectedSubject(val);
                const sub = SUBJECT_MAP[val];
                if (sub) setSelectedTopic(sub.topics[0]);
              }}
              options={Object.values(SUBJECT_MAP).map((s) => ({ label: `${s.abbr} — ${s.name}`, value: s.key }))}
            />
            <SelectField
              label="Topic"
              value={selectedTopic}
              onChange={setSelectedTopic}
              options={currentSubjectObj.topics}
            />
            <SelectField
              label="Company track"
              value={selectedCompany}
              onChange={setSelectedCompany}
              options={COMPANY_TRACKS.map((c) => ({ label: c.label, value: c.id }))}
            />
            <div>
              <div className="field-label">Difficulty</div>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_LEVELS.map((level) => {
                  const val = level.toLowerCase();
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedDifficulty(val)}
                      className={`rounded-lg border px-3 py-3 text-sm font-bold transition ${
                        selectedDifficulty === val
                          ? "border-[#17201f] bg-[#17201f] text-white"
                          : "border-[#d8d4cb] bg-white hover:border-[#999]"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4 border-t border-[#e5e1d9] pt-6">
            <span className="font-mono text-[10px] text-[#7a7e79]">RAG SYNTHESIZED · 30-POINT RUBRIC</span>
            <Button onClick={handleGenerateQuestion} disabled={loading} className="px-6 py-3">
              {loading ? "Generating question..." : "Generate question"}
              {!loading && <Icon name="spark" size={17} />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Answer
  if (step === 2 && question) {
    const subObj = SUBJECT_MAP[question.subject.toLowerCase()] || currentSubjectObj;
    return (
      <div className="mx-auto max-w-5xl">
        <PracticeHeader step={step} />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border border-[#d8d4ca] bg-white p-6 md:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <span className={`tag ${subObj.badgeTone}`}>{subObj.abbr}</span>
                <span className="tag bg-[#f2f0e9] text-[#5f645f]">{question.topic}</span>
                <span className="tag bg-[#f5f3ed] text-[#777] capitalize">{question.difficulty_tag}</span>
              </div>
              <span className="font-mono text-xs font-bold">30 MARKS RUBRIC</span>
            </div>
            <h1 className="mt-7 text-2xl font-extrabold leading-snug tracking-[-.025em] md:text-3xl">
              {question.question_text}
            </h1>

            {error && (
              <div className="mt-4 rounded-lg border border-[#f5c6cb] bg-[#f8d7da] p-3 text-xs font-semibold text-[#721c24]">
                {error}
              </div>
            )}

            <div className="mt-8">
              <div className="mb-2 flex justify-between">
                <span className="field-label !mb-0">Your technical explanation</span>
                <span className="font-mono text-[10px] text-[#747873]">{wordCount} WORDS</span>
              </div>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="min-h-[240px] w-full resize-none rounded-xl border border-[#cbc7be] bg-[#fcfbf8] p-4 text-sm leading-7 outline-none transition focus:border-[#4169e1] focus:ring-2 focus:ring-[#4169e1]/10"
                placeholder="Structure your answer clearly. Explain the underlying mechanics, discuss trade-offs, and cover key edge cases..."
              />
            </div>

            {hint && (
              <div className="mt-3 rounded-lg border border-[#efdfb7] bg-[#fff9e9] p-3 text-sm text-[#735c24]">
                <strong>Technical Hint:</strong> Ground your answer in exact definitions, state standard trade-offs (e.g. time vs space, normalization vs query speed), and mention how production systems handle failure modes.
              </div>
            )}

            <div className="mt-5 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setHint(!hint)}>
                <Icon name="spark" size={16} /> {hint ? "Hide hint" : "Request hint"}
              </Button>
              <Button onClick={handleSubmitAnswer} disabled={loading} className="px-6">
                {loading ? "Evaluating on rubric..." : "Submit answer"}
                {!loading && <Icon name="arrow" size={16} />}
              </Button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl bg-[#17201f] p-6 text-white">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase text-[#9ba6a2]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff5b39]"></span> Time remaining
              </div>
              <div className="mt-3 font-mono text-4xl font-bold tracking-[-.05em]">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-[#ff5b39]" style={{ width: `${(seconds / 180) * 100}%` }}></div>
              </div>
            </div>
            <div className="rounded-xl border border-[#d8d4ca] bg-[#f0ede5] p-5">
              <div className="font-mono text-[10px] font-bold uppercase text-[#777b76]">Evaluation focus</div>
              {[
                "Correctness (10 marks)",
                "Completeness & Mechanisms (10 marks)",
                "Clarity & Technical structure (10 marks)",
              ].map((x) => (
                <div key={x} className="mt-4 flex gap-2 text-xs font-semibold">
                  <span className="text-[#60a789]">✓</span>
                  {x}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Step 3: Evaluation
  if (step === 3 && evaluation) {
    const totalScore = Math.round(evaluation.overall_score || 0);
    const scoreColor =
      totalScore >= 24 ? "#60b89a" : totalScore >= 18 ? "#f3b83f" : "#ff5b39";
    const readinessLabel =
      totalScore >= 24 ? "Product Standard" : totalScore >= 18 ? "Solid Foundation" : "Needs Revision";

    const dimensions = [
      {
        label: "Correctness",
        score: Math.round(evaluation.correctness_score),
        status: evaluation.correctness_score >= 8 ? "Strong" : evaluation.correctness_score >= 5 ? "Moderate" : "Weak",
        desc: "Factual accuracy and alignment with textbook ground truth.",
        color: "#4169e1",
      },
      {
        label: "Completeness",
        score: Math.round(evaluation.completeness_score),
        status: evaluation.completeness_score >= 8 ? "Thorough" : evaluation.completeness_score >= 5 ? "Adequate" : "Incomplete",
        desc: "Coverage of core mechanics, trade-offs, and critical nuances.",
        color: "#f3b83f",
      },
      {
        label: "Clarity",
        score: Math.round(evaluation.clarity_score),
        status: evaluation.clarity_score >= 8 ? "Excellent" : evaluation.clarity_score >= 5 ? "Understandable" : "Unclear",
        desc: "Structure, technical precision, and communication efficiency.",
        color: "#60b89a",
      },
    ];

    return (
      <div className="mx-auto max-w-5xl">
        <PracticeHeader step={3} />
        <div className="mt-8 rounded-2xl bg-[#17201f] p-6 text-white md:p-9">
          <div className="grid items-end gap-6 md:grid-cols-[.7fr_1.3fr]">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#9da7a3]">
                Your total score
              </div>
              <div className="mt-2 text-7xl font-black tracking-[-.07em]">
                {totalScore}
                <span className="text-2xl text-[#7f8b87]">/30</span>
              </div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold">
                <span>Interview readiness</span>
                <span style={{ color: scoreColor }}>{readinessLabel}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(totalScore / 30) * 100}%`, backgroundColor: scoreColor }}
                ></div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#9ea8a4]">
                {totalScore >= 24
                  ? "Outstanding conceptual depth and technical precision. Ready for top-tier interview panels."
                  : totalScore >= 18
                  ? "Demonstrates clear fundamental understanding. Focus on covering edge cases and trade-offs."
                  : "Review the flagged gaps and textbook fundamentals before retrying."}
              </p>
            </div>
          </div>
        </div>

        <section className="mt-7">
          <SectionTitle eyebrow="Rubric breakdown" title="How your answer performed" />
          <div className="grid gap-4 md:grid-cols-3">
            {dimensions.map((dim) => (
              <div key={dim.label} className="rounded-xl border border-[#d9d5cc] bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-extrabold">{dim.label}</div>
                    <span
                      className="mt-1 inline-block font-mono text-[9px] font-bold uppercase"
                      style={{ color: dim.color }}
                    >
                      {dim.status}
                    </span>
                  </div>
                  <div className="text-3xl font-black">
                    {dim.score}
                    <span className="text-xs text-[#999]">/10</span>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#ebe8e1]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${dim.score * 10}%`, backgroundColor: dim.color }}
                  ></div>
                </div>
                <p className="mt-4 text-xs leading-5 text-[#6f746f]">{dim.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-7 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <section className="rounded-xl border border-[#d9d5cc] bg-white p-6">
            <div className="font-mono text-[10px] font-bold uppercase text-[#ff5b39]">Targeted Gaps</div>
            <h3 className="mt-1 text-lg font-extrabold">Weakest Subtopic</h3>
            <div className="mt-5">
              <span className="rounded-md border border-[#ebc9c0] bg-[#fff4f1] px-3 py-2 text-xs font-bold text-[#b4452e]">
                {evaluation.weakest_subtopic || "Concept trade-offs"}
              </span>
              <p className="mt-4 text-xs leading-5 text-[#777]">
                Make sure to practice this specific subtopic in your next session to eliminate recurring gaps.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[#d9d5cc] bg-white p-6">
            <div className="font-mono text-[10px] font-bold uppercase text-[#4169e1]">Examiner Feedback</div>
            <h3 className="mt-1 text-lg font-extrabold">Detailed Evaluation</h3>
            <p className="mt-4 text-sm leading-6 text-[#626762] whitespace-pre-line">
              {evaluation.feedback_text}
            </p>
          </section>
        </div>

        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={exit}>
            Return to dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setAnswerText("");
              setSeconds(180);
              setStep(2);
            }}
          >
            Retry question
          </Button>
          <Button
            onClick={() => {
              setAnswerText("");
              setHint(false);
              setSeconds(180);
              setStep(1);
            }}
          >
            Next question <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ── History View ───────────────────────────────────────────────────────────────
function History({ onStartPractice }: { onStartPractice: (sub?: string) => void }) {
  const [answers, setAnswers] = useState<AnswerHistoryEntry[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      try {
        const [ans, dash] = await Promise.all([
          historyApi.getAnswers(selectedSubjectFilter === "all" ? undefined : selectedSubjectFilter),
          historyApi.getDashboard().catch(() => null),
        ]);
        if (isMounted) {
          setAnswers(ans);
          if (dash) setDashboard(dash);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedSubjectFilter]);

  const totalSessions = dashboard?.total_answers_submitted ?? answers.length;
  const avgOverall =
    dashboard?.subject_scores && dashboard.subject_scores.length > 0
      ? (
          dashboard.subject_scores.reduce((acc, s) => acc + s.avg_overall, 0) / dashboard.subject_scores.length
        ).toFixed(1)
      : answers.length > 0
      ? (answers.reduce((acc, a) => acc + (a.overall_score || 0), 0) / answers.length).toFixed(1)
      : "0";

  return (
    <div>
      <div className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#ff5b39]">Progress archive</div>
      <h1 className="mt-1 text-4xl font-black tracking-[-.045em]">Session history</h1>
      <p className="mt-3 text-sm text-[#6e736f]">Every answer, score, and weak spot — in one auditable record.</p>

      {/* Metrics Row */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [String(totalSessions), "Sessions completed"],
          [`${avgOverall}`, "Average score / 30"],
          ["5 Subjects", "Curriculum covered"],
          ["30-point", "Rubric standard"],
        ].map(([value, label], i) => (
          <div key={label} className="rounded-xl border border-[#d8d4ca] bg-white p-5">
            <div className={`text-3xl font-black ${i === 1 ? "text-[#4169e1]" : i === 0 ? "text-[#ff5b39]" : ""}`}>
              {value}
            </div>
            <div className="mt-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#777b76]">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter and Table */}
      <section className="mt-9">
        <SectionTitle
          eyebrow="All attempts"
          title="Recent interviews"
          action={
            <div className="flex gap-1 overflow-x-auto pb-1">
              {["all", "dbms", "dsa", "os", "cn", "oop"].map((subKey) => (
                <button
                  key={subKey}
                  onClick={() => setSelectedSubjectFilter(subKey)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase ${
                    selectedSubjectFilter === subKey
                      ? "bg-[#17201f] text-white"
                      : "border border-[#d5d1c8] bg-white text-[#666] hover:border-[#17201f]"
                  }`}
                >
                  {subKey}
                </button>
              ))}
            </div>
          }
        />

        {loading ? (
          <div className="rounded-xl border border-[#d8d4ca] bg-white p-12 text-center text-sm font-semibold text-[#777]">
            Loading session records...
          </div>
        ) : answers.length === 0 ? (
          <div className="rounded-xl border border-[#d8d4ca] bg-white p-12 text-center">
            <h3 className="text-lg font-bold">No sessions found</h3>
            <p className="mt-1 text-sm text-[#777]">You haven't completed any mock interviews in this category yet.</p>
            <Button onClick={() => onStartPractice(selectedSubjectFilter === "all" ? undefined : selectedSubjectFilter)} className="mt-5">
              Start your first session
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#d8d4ca] bg-white">
            <table className="w-full min-w-[780px] text-left">
              <thead className="bg-[#efede6] font-mono text-[9px] uppercase tracking-wider text-[#777b76]">
                <tr>
                  {["Date", "Subject / topic", "Difficulty", "Score", ""].map((h) => (
                    <th key={h} className="px-5 py-3 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {answers.map((row, i) => {
                  const subObj = SUBJECT_MAP[row.subject.toLowerCase()] || SUBJECT_MAP.dbms;
                  const dateFormatted = new Date(row.submitted_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={row.answer_id} className="border-t border-[#e5e1d9] text-sm">
                      <td className="px-5 py-4 text-xs text-[#727671]">{dateFormatted}</td>
                      <td className="px-5 py-4">
                        <span className={`tag mr-2 ${subObj.badgeTone}`}>{subObj.abbr}</span>
                        <span className="font-bold">{row.topic}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="tag bg-[#f2f0ea] capitalize">{row.difficulty_tag}</span>
                      </td>
                      <td className="px-5 py-4 font-extrabold">
                        {row.overall_score != null ? Math.round(row.overall_score) : "—"}
                        <span className="text-xs text-[#999]">/30</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                          className="text-xs font-bold text-[#4169e1] hover:underline"
                        >
                          {expandedIndex === i ? "Close" : "View evaluation →"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Expanded Evaluation Detail */}
        {expandedIndex !== null && answers[expandedIndex] && (
          <div className="mt-3 rounded-xl border border-[#ccd4ed] bg-[#f0f3ff] p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-extrabold">
                  Evaluation details · {answers[expandedIndex].subject.toUpperCase()} — {answers[expandedIndex].topic}
                </div>
                <p className="mt-1 text-xs text-[#556]">
                  Correctness: {answers[expandedIndex].correctness_score ?? "—"} · Completeness:{" "}
                  {answers[expandedIndex].completeness_score ?? "—"} · Clarity:{" "}
                  {answers[expandedIndex].clarity_score ?? "—"}
                </p>
              </div>
              <span className="tag bg-white text-[#4169e1] border border-[#ccd4ed]">
                {answers[expandedIndex].weakest_subtopic
                  ? `Focus: ${answers[expandedIndex].weakest_subtopic}`
                  : "Evaluated"}
              </span>
            </div>
            <div className="mt-3 text-xs font-bold text-[#445]">Question:</div>
            <p className="mt-1 text-sm text-[#334] font-medium">{answers[expandedIndex].question_text}</p>
            {answers[expandedIndex].feedback_text && (
              <>
                <div className="mt-3 text-xs font-bold text-[#445]">Examiner Feedback:</div>
                <p className="mt-1 text-sm leading-6 text-[#595f6c] whitespace-pre-line">
                  {answers[expandedIndex].feedback_text}
                </p>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Resume Matcher Component ───────────────────────────────────────────────────
function ResumeMatcher() {
  const [analyzed, setAnalyzed] = useState(false);
  const [file, setFile] = useState("");
  const [jd, setJd] = useState("");

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <div className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#ff5b39]">
          Resume intelligence
        </div>
        <h1 className="mt-1 text-4xl font-black tracking-[-.045em]">Match the role, precisely.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e736f]">
          Compare your resume against target campus job descriptions to spot missing technical signals before interviews.
        </p>
      </div>

      {!analyzed ? (
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#d8d4ca] bg-white p-6">
            <div className="field-label">01 · Your resume</div>
            <label className="mt-3 grid min-h-[280px] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-[#ccc7bc] bg-[#faf9f5] p-8 text-center transition hover:border-[#4169e1]">
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0]?.name || "")}
              />
              <div>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e9edff] text-[#4169e1]">
                  <Icon name="upload" />
                </div>
                <div className="mt-4 text-sm font-extrabold">{file || "Drop your resume PDF here"}</div>
                <p className="mt-2 text-xs text-[#858984]">
                  {file ? "PDF ready for analysis" : "or click to browse · max 5 MB"}
                </p>
              </div>
            </label>
          </section>

          <section className="rounded-2xl border border-[#d8d4ca] bg-white p-6">
            <div className="field-label">02 · Job description</div>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="mt-3 min-h-[280px] w-full resize-none rounded-xl border border-[#d2cec5] bg-[#faf9f5] p-4 text-sm leading-6 outline-none focus:border-[#4169e1]"
              placeholder="Paste the target job description or placement criteria here..."
            />
          </section>

          <div className="flex justify-end lg:col-span-2">
            <Button onClick={() => setAnalyzed(true)} className="px-7 py-3">
              <Icon name="spark" size={17} /> Analyze match
            </Button>
          </div>
        </div>
      ) : (
        <ResumeResults onReset={() => setAnalyzed(false)} />
      )}
    </div>
  );
}

function ResumeResults({ onReset }: { onReset: () => void }) {
  const groups = [
    ["Matched skills", "check", "#60b89a", ["Python", "Data Structures", "SQL", "Git", "REST APIs"]],
    ["Missing skills", "x", "#ff5b39", ["System Design", "AWS", "Docker", "Redis"]],
    ["Weak / peripheral", "clock", "#f3b83f", ["PostgreSQL", "Microservices", "CI/CD"]],
  ];
  return (
    <div className="mt-9">
      <div className="grid gap-5 md:grid-cols-[290px_1fr]">
        <div className="rounded-2xl bg-[#4169e1] p-7 text-white">
          <div className="font-mono text-[10px] font-bold uppercase text-white/60">Overall match</div>
          <div className="mt-5 text-7xl font-black tracking-[-.07em]">
            68<span className="text-2xl">%</span>
          </div>
          <div className="mt-5 h-2 rounded-full bg-white/15">
            <div className="h-full w-[68%] rounded-full bg-white"></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/70">
            Solid foundation in core CS subjects, with 4 critical deployment signals missing.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {groups.map(([title, icon, color, skills]) => (
            <div key={title as string} className="rounded-xl border border-[#d8d4ca] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <span style={{ color: color as string }}>
                  <Icon name={icon as string} size={17} />
                </span>
                {title}
              </div>
              <div className="mt-5 space-y-2">
                {(skills as string[]).map((skill) => (
                  <div key={skill} className="rounded-md bg-[#f4f2ec] px-2.5 py-2 text-xs font-semibold">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-[#d8d4ca] bg-white p-6">
        <SectionTitle
          eyebrow="Preparation plan"
          title="Close the highest-impact gaps"
          action={
            <button onClick={onReset} className="text-xs font-bold text-[#4169e1] hover:underline">
              Analyze another →
            </button>
          }
        />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            [
              "01",
              "System design fundamentals",
              "Practice scalability, caching, and database normalization trade-off explanations.",
            ],
            ["02", "Ship a containerized project", "Add Docker and cloud deployment signals to one core project."],
            ["03", "Strengthen impact language", "Quantify API latency, users served, and reliability improvements."],
          ].map(([num, title, body]) => (
            <div key={num} className="rounded-lg bg-[#f4f2ec] p-4">
              <span className="font-mono text-[10px] font-bold text-[#ff5b39]">{num}</span>
              <h4 className="mt-3 text-sm font-extrabold">{title}</h4>
              <p className="mt-2 text-xs leading-5 text-[#747873]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Profile Drawer ─────────────────────────────────────────────────────────────
function Profile({
  user,
  onClose,
  onLogout,
  onUserUpdated,
}: {
  user: UserOut | null;
  onClose: () => void;
  onLogout: () => void;
  onUserUpdated: (u: UserOut) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AM";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload: { name?: string; password?: string } = {};
      if (name.trim()) payload.name = name.trim();
      if (password) payload.password = password;

      const updated = await authApi.updateMe(payload);
      onUserUpdated(updated);
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setPassword("");
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || err.message || "Failed to update profile.";
      setMsg({ type: "error", text: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onMouseDown={onClose}>
      <aside
        className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-[#f7f5ef] p-7 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Your profile</h2>
          <button onClick={onClose} className="rounded-md p-2 hover:bg-black/5" aria-label="Close profile">
            <Icon name="x" />
          </button>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#4169e1] text-lg font-black text-white">
            {initials}
          </div>
          <div>
            <h3 className="text-lg font-extrabold">{user?.name || "Student"}</h3>
            <p className="text-sm text-[#747873]">{user?.email || "student@college.edu"}</p>
          </div>
        </div>

        {msg && (
          <div
            className={`mt-4 rounded-lg p-3 text-xs font-semibold ${
              msg.type === "success"
                ? "border border-[#c3e6cb] bg-[#d4edda] text-[#155724]"
                : "border border-[#f5c6cb] bg-[#f8d7da] text-[#721c24]"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSave}>
          <label className="block">
            <span className="field-label">Full name</span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </label>
          <label className="block">
            <span className="field-label">Email (Account ID)</span>
            <input className="field opacity-70 cursor-not-allowed" value={user?.email || ""} disabled />
          </label>
          <label className="block">
            <span className="field-label">New Password (leave empty to keep current)</span>
            <input
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <Button type="submit" variant="dark" disabled={saving} className="w-full">
            {saving ? "Saving changes..." : "Save profile changes"}
          </Button>
        </form>

        <button
          onClick={onLogout}
          className="mt-8 flex items-center gap-2 text-sm font-bold text-[#c7462f] hover:underline"
        >
          <Icon name="logout" size={17} /> Sign out
        </button>
      </aside>
    </div>
  );
}

// ── Root App Component ─────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [currentUser, setCurrentUser] = useState<UserOut | null>(null);
  const [authModal, setAuthModal] = useState<"signin" | "signup" | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [practiceSubject, setPracticeSubject] = useState("dbms");
  const [practiceTopic, setPracticeTopic] = useState<string | undefined>(undefined);

  // Check existing login on startup
  useEffect(() => {
    async function checkAuth() {
      if (hasToken()) {
        try {
          const user = await authApi.me();
          setCurrentUser(user);
          setScreen("dashboard");
        } catch (err) {
          authApi.logout();
          setCurrentUser(null);
          setScreen("landing");
        }
      }
    }
    checkAuth();
  }, []);

  const handleAuthSuccess = (user: UserOut) => {
    setCurrentUser(user);
    setAuthModal(null);
    setScreen("dashboard");
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setProfileOpen(false);
    setScreen("landing");
  };

  const isApp = screen !== "landing";

  const content = useMemo(() => {
    if (screen === "dashboard") {
      return (
        <Dashboard
          user={currentUser}
          goPractice={(subject = "dbms", topic) => {
            setPracticeSubject(subject);
            setPracticeTopic(topic);
            setScreen("practice");
          }}
          goResume={() => setScreen("resume")}
          goHistory={() => setScreen("history")}
        />
      );
    }
    if (screen === "practice") {
      return (
        <Practice
          key={`${practiceSubject}-${practiceTopic || "default"}`}
          initialSubject={practiceSubject}
          initialTopic={practiceTopic}
          exit={() => setScreen("dashboard")}
        />
      );
    }
    if (screen === "resume") {
      return <ResumeMatcher />;
    }
    if (screen === "history") {
      return (
        <History
          onStartPractice={(sub) => {
            if (sub) setPracticeSubject(sub);
            setScreen("practice");
          }}
        />
      );
    }
    return null;
  }, [screen, practiceSubject, practiceTopic, currentUser]);

  return (
    <>
      {isApp ? (
        <Shell
          screen={screen}
          setScreen={setScreen}
          onProfile={() => setProfileOpen(true)}
          user={currentUser}
        >
          {content}
        </Shell>
      ) : (
        <Landing
          onEnter={() => setAuthModal("signup")}
          onSignIn={() => setAuthModal("signin")}
        />
      )}

      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {profileOpen && (
        <Profile
          user={currentUser}
          onClose={() => setProfileOpen(false)}
          onLogout={handleLogout}
          onUserUpdated={(u) => setCurrentUser(u)}
        />
      )}
    </>
  );
}
