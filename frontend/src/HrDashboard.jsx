import { useEffect, useState } from "react";
import HrLayout from "./HrLayout.jsx";
import { authFetch } from "./auth.js";
import { Link, useSearchParams } from "react-router-dom";

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 20 }}>{name}</span>
);

// backend created_at timezone ke bina (UTC) aata hai, isliye Z lagake parse karte hain
const formatDate = (iso) => {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso) => {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  return new Date(hasZone ? iso : `${iso}Z`).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

const REC_STYLE = {
  "Strong Hire": "bg-emerald-50 text-emerald-700",
  Hire: "bg-indigo-50 text-primary",
  Borderline: "bg-surface-container text-on-surface-variant",
  "No Hire": "bg-red-50 text-red-700",
};

const STATUS_LABEL = {
  in_progress: "In progress",
  completed: "Completed",
  ended_by_proctoring: "Ended by proctoring",
};

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">{label}</span>
        <span className="rounded-md bg-indigo-50 p-1 text-primary">
          <Icon name={icon} />
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold text-on-surface">{value}</div>
    </div>
  );
}

function JobCard({ job, onChanged, selected, onSelect }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/apply/${job.public_id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [toggling, setToggling] = useState(false);

  const toggleStatus = async () => {
    setToggling(true);
    try {
      const res = await authFetch(`/jobs/${job.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !job.is_active }),
      });
      if (res.ok) onChanged();
    } finally {
      setToggling(false);
    }
  };

  return (
        <div
      className={`flex flex-col rounded-xl border bg-surface-container-lowest p-4 ${
        selected ? "border-primary" : "border-outline-variant"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs uppercase tracking-wide text-on-surface-variant">
          {job.department || "No department"}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
            job.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {job.is_active ? "● Active" : "Inactive"}
        </span>
      </div>

      <h3 className="mt-1 font-semibold text-on-surface">{job.title}</h3>

      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">{job.level}</span>
        <span className="rounded bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
          {job.max_questions} questions
        </span>
      </div>

      <div className="mt-3 text-xs text-on-surface-variant">Created {formatDate(job.created_at)}</div>

      <button
        onClick={() => onSelect(job.id)}
        className="mt-3 flex items-center gap-1 text-sm font-medium text-primary"
      >
        <Icon name="group" />
        {selected ? "Viewing candidates" : "View candidates"}
      </button>

      <div className="mt-4 flex items-center justify-between">
        <button onClick={copyLink} className="flex items-center gap-1 text-sm font-medium text-primary">
          <Icon name={copied ? "check" : "link"} />
          {copied ? "Link copied" : "Copy apply link"}
        </button>
        <button
          onClick={toggleStatus}
          disabled={toggling}
          className="text-sm font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-50"
        >
          {job.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}

function CandidatesTable({ job }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setRows([]);

    authFetch(`/jobs/${job.id}/candidates`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Could not load candidates");
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [job.id]);

  return (
    <section>
      <h2 className="mb-2 font-semibold text-on-surface">Candidates · {job.title}</h2>

      {loading && <div className="text-sm text-on-surface-variant">Loading…</div>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
          No candidates have taken this interview yet.
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-outline-variant text-xs uppercase tracking-wide text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Recommendation</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Violations</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Completed</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.interview_id} className="border-b border-outline-variant last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-on-surface">{c.name}</div>
                    <div className="text-xs text-on-surface-variant">{c.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        c.status === "ended_by_proctoring"
                          ? "bg-red-50 text-red-700"
                          : c.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.recommendation ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${REC_STYLE[c.recommendation] ?? ""}`}>
                        {c.recommendation}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-on-surface">{c.overall_score ?? "—"}</td>
                  <td className="px-4 py-3 text-on-surface">{c.violation_count}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{formatDateTime(c.started_at)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {c.completed_at ? formatDateTime(c.completed_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.recommendation && (
                      <Link to={`/hr/candidates/${c.interview_id}`} className="font-medium text-primary">
                        View report
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function HrDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [searchParams] = useSearchParams();
  const candidatesView = searchParams.get("view") === "candidates";

  const loadJobs = async () => {
    setError("");
    try {
      const res = await authFetch("/jobs");
      if (!res.ok) throw new Error("Could not load jobs");
      setJobs(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const activeCount = jobs.filter((j) => j.is_active).length;

  const selectedJob = jobs.find((j) => j.id === selectedId) ?? (candidatesView ? jobs[0] ?? null : null);

return (
  <HrLayout onJobCreated={loadJobs}>
    <div className="mx-auto max-w-6xl space-y-6">
      {candidatesView ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Candidates</h1>
              <p className="text-sm text-on-surface-variant">
                Select a job to see who has taken the interview.
              </p>
            </div>
            {jobs.length > 0 && (
              <select
                value={selectedJob?.id ?? ""}
                onChange={(e) =>
                  setSelectedId(jobs.find((j) => String(j.id) === e.target.value)?.id ?? null)
                }
                className="rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                    {j.department ? ` · ${j.department}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loading && <div className="text-sm text-on-surface-variant">Loading…</div>}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
              Create a job first to start receiving candidates.
            </div>
          )}

          {selectedJob && <CandidatesTable job={selectedJob} />}
        </>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Jobs</h1>
            <p className="text-sm text-on-surface-variant">
              Create jobs and share the apply link with candidates.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active roles" value={activeCount} icon="work" />
            <StatCard label="Total roles" value={jobs.length} icon="inventory_2" />
          </div>

          <section>
            <h2 className="mb-2 font-semibold text-on-surface">All Jobs</h2>

            {loading && <div className="text-sm text-on-surface-variant">Loading…</div>}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            {!loading && !error && jobs.length === 0 && (
              <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
                There are no jobs yet. Create your first job using the "Create Job" option above.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  onChanged={loadJobs}
                  selected={j.id === selectedId}
                  onSelect={setSelectedId}
                />
              ))}
            </div>
          </section>

          {selectedJob && <CandidatesTable job={selectedJob} />}
        </>
      )}
    </div>
  </HrLayout>
);
}