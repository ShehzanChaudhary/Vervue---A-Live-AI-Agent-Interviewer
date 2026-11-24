import { useState } from "react";
import CreateJobModal from "./CreateJobModal.jsx";
import { Link } from "react-router-dom";
import HrLayout from "./HrLayout.jsx";

const STATS = [
  { label: "Active roles", value: "8", sub: "Openings", icon: "work" },
  { label: "Completed sessions", value: "142", sub: "Total", icon: "task_alt" },
  { label: "Avg completion rate", value: "94.2%", sub: "", icon: "donut_large" },
  { label: "Proctor anomalies", value: "3", sub: "Flagged", icon: "gpp_maybe", danger: true },
];

const REQUISITIONS = [
  { id: 1, dept: "Distributed Systems", title: "Senior Distributed Systems Architect", tags: ["Kafka", "Go", "Raft"], done: 16, quota: 62, live: 4 },
  { id: 2, dept: "Foundation AI / Systems", title: "Staff Machine Learning Engineer (LLM Platform)", tags: ["PyTorch", "CUDA", "Triton"], done: 12, quota: 29, live: 2 },
  { id: 3, dept: "Cloud Operations", title: "Lead Cloud Infrastructure Architect", tags: ["Kubernetes", "Terraform", "AWS"], done: 9, quota: 18, live: 1 },
];

const CANDIDATES = [
  { initials: "SL", name: "Sarah Lin", email: "sarah.lin@berkeley.alumni.edu", role: "Senior Distributed Systems Architect", dept: "Core Infrastructure", when: "Today at 2:41 PM", detail: "Duration: 54m 12s", proctor: "clean", proctorText: "Verified Clean (0 strikes)", score: 94, rec: "Strong Hire" },
  { initials: "DC", name: "David Chen", email: "d.chen@vectorlabs.ai", role: "Staff ML Engineer (LLM Platform)", dept: "Autonomous Foundation Models", when: "Yesterday at 2:10 PM", detail: "Duration: 58m 04s", proctor: "clean", proctorText: "Verified Clean (0 strikes)", score: 88, rec: "Hire" },
  { initials: "MV", name: "Marcus Vance", email: "m.vance@cloudnovo.io", role: "Lead Cloud Infrastructure Architect", dept: "Cloud Platform & SRE", when: "Today at 11:20 AM", detail: "Duration: 49m 41s", proctor: "warn", proctorText: "1 Warning (Fullscreen Exit)", score: 74, rec: "Borderline" },
  { initials: "ER", name: "Elena Rostova", email: "elena.rostova@gaynapse-sys.ru", role: "Senior Distributed Systems Architect", dept: "Core Infrastructure", when: "Today at 2:03 PM", detail: "Terminated at 12m 16s", proctor: "ended", proctorText: "Ended by Proctoring (3/3 Strikes)", score: 42, rec: "Disqualified" },
  { initials: "PP", name: "Priya Patel", email: "priya.patel@nexus-scale.com", role: "Staff ML Engineer (LLM Platform)", dept: "Autonomous Foundation Models", when: "Live: In Progress (24/40)", detail: "Elapsed: 44m 38s", proctor: "live", proctorText: "Monitoring Active (Zero Flags)", score: null, rec: "Evaluation Pending" },
];

const PROCTOR_STYLE = {
  clean: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  ended: "bg-red-50 text-red-700 border-red-200",
  live: "bg-sky-50 text-sky-700 border-sky-200",
};

const REC_STYLE = {
  "Strong Hire": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Hire: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Borderline: "bg-slate-100 text-slate-700 border-slate-200",
  Disqualified: "bg-red-50 text-red-700 border-red-200",
  "Evaluation Pending": "bg-white text-slate-500 border-slate-200",
};

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 20 }}>{name}</span>
);

function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col justify-between border-r border-outline-variant bg-surface-container-lowest p-4 sticky top-0 h-screen">
      <div>
        <div className="mb-6 px-2">
          <div className="font-bold text-on-surface">AI Interviewer</div>
          <div className="text-xs text-on-surface-variant">Talent Ops</div>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <button
              key={n.label}
              onClick={() => onChange(n.label)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                active === n.label ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <Icon name={n.icon} /> {n.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">AR</div>
        <div className="min-w-0 text-sm">
          <div className="truncate font-medium text-on-surface">Alex Rivera</div>
          <div className="truncate text-xs text-on-surface-variant">Head of Technical Talent</div>
        </div>
      </div>
    </aside>
  );
}

function StatCard({ s }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{s.label}</span>
        <span className={`rounded-md p-1 ${s.danger ? "bg-red-50 text-red-600" : "bg-indigo-50 text-primary"}`}>
          <Icon name={s.icon} />
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${s.danger ? "text-red-600" : "text-on-surface"}`}>{s.value}</span>
        <span className="text-sm text-on-surface-variant">{s.sub}</span>
      </div>
    </div>
  );
}

function RequisitionCard({ r }) {
  const pct = Math.round((r.done / r.quota) * 100);
  return (
    <div className="min-w-[280px] flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-on-surface-variant">{r.dept}</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">● Active</span>
      </div>
      <h3 className="mt-1 font-semibold text-on-surface">{r.title}</h3>
      <div className="mt-2 flex flex-wrap gap-1">
        {r.tags.map((t) => (
          <span key={t} className="rounded bg-surface-container px-2 py-0.5 font-mono text-xs text-on-surface-variant">{t}</span>
        ))}
      </div>
      <div className="mt-4 flex justify-between text-xs text-on-surface-variant">
        <span>Progress to quota</span>
        <span>{r.done} / {r.quota} completed</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-surface-container">
        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 text-xs text-on-surface-variant">{r.live} in-progress live</div>
      <button className="mt-3 text-sm font-medium text-primary">Manage Requisition →</button>
    </div>
  );
}

function Provisioner() {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [count, setCount] = useState(5);

  const publish = () => {
    console.log("publish requisition (mock)", { title, dept, count });
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <h3 className="font-semibold text-on-surface">Quick Requisition</h3>
      <p className="text-sm text-on-surface-variant">Set up a new interview in seconds.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-xs font-medium text-on-surface-variant">
          Job title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Principal Cloud Platform Engineer"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>
        <label className="text-xs font-medium text-on-surface-variant">
          Department
          <input
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            placeholder="e.g. Core Infrastructure"
            className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>
        <label className="text-xs font-medium text-on-surface-variant">
          Questions: {count}
          <input
            type="range"
            min={2}
            max={15}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-3 w-full accent-indigo-600"
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="rounded-lg border border-outline-variant px-4 py-2 text-sm text-on-surface">Save as Draft</button>
        <button onClick={publish} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary">Publish Requisition</button>
      </div>
    </section>
  );
}

function FilterChip({ icon, label }) {
  return (
    <button className="flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm text-on-surface">
      {icon && <Icon name={icon} />} {label} <Icon name="expand_more" />
    </button>
  );
}

function CandidatesTable() {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant p-3">
        <FilterChip icon="filter_list" label="Filter by" />
        <FilterChip label="All Roles (8)" />
        <FilterChip label="All Statuses" />
        <FilterChip label="All Recommendations" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Target position</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Proctoring</th>
              <th className="px-4 py-3">AI recommendation</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {CANDIDATES.map((c, i) => (
              <tr key={c.email} className={`border-t border-outline-variant ${c.proctor === "ended" ? "bg-red-50/40" : ""}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{c.initials}</div>
                    <div>
                      <div className="font-medium text-on-surface">{c.name}</div>
                      <div className="text-xs text-on-surface-variant">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-on-surface">{c.role}</div>
                  <div className="text-xs text-on-surface-variant">{c.dept}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-on-surface">{c.when}</div>
                  <div className="font-mono text-xs text-on-surface-variant">{c.detail}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full border px-2 py-1 text-xs ${PROCTOR_STYLE[c.proctor]}`}>{c.proctorText}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full border px-2 py-1 text-xs font-medium ${REC_STYLE[c.rec]}`}>
                    {c.score !== null ? `${c.score}/100 · ${c.rec.toUpperCase()}` : c.rec}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link to={`/hr/candidates/${i + 1}`} className="text-sm font-medium text-primary">
                    View Report
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-outline-variant px-4 py-3 text-sm text-on-surface-variant">
        <span>Showing 1 to 5 of 142 candidates</span>
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 text-on-surface-variant">Previous</button>
          <button className="rounded bg-primary px-2.5 py-1 text-on-primary">1</button>
          <button className="px-2.5 py-1">2</button>
          <button className="px-2.5 py-1">3</button>
          <span>…</span>
          <button className="px-2.5 py-1">29</button>
          <button className="px-2 py-1">Next</button>
        </div>
      </div>
    </section>
  );
}

export default function HrDashboard() {
  return (
    <HrLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Technical Hiring Pipeline & Evaluations</h1>
          <p className="text-sm text-on-surface-variant">
            Monitor active requisitions, watch live interviews, and review scored candidate reports.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => <StatCard key={s.label} s={s} />)}
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-on-surface">Active Requisitions</h2>
            <button className="text-sm font-medium text-primary">View all 8 open tracks →</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {REQUISITIONS.map((r) => <RequisitionCard key={r.id} r={r} />)}
          </div>
        </section>

        <Provisioner />
        <CandidatesTable />
      </div>
    </HrLayout>
  );
}