import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import HrLayout from "./HrLayout.jsx";
import { authFetch } from "./auth.js";

const REC_STYLE = {
  "Strong Hire": "bg-tertiary-container text-on-tertiary-container",
  Hire: "bg-primary-container text-on-primary",
  Borderline: "bg-surface-container-high text-on-surface",
  "No Hire": "bg-error-container text-on-error-container",
};

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

function Card({ children, className = "" }) {
  return (
    <section className={`mb-space-lg rounded-xl bg-surface-container-lowest p-space-lg shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function SectionHead({ icon, title, sub }) {
  return (
    <div className="mb-space-md flex items-center gap-space-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
        <Icon name={icon} className="text-[20px]" />
      </div>
      <div>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
        {sub && <span className="font-body-sm text-body-sm text-secondary">{sub}</span>}
      </div>
    </div>
  );
}

function Proctoring({ p, ended }) {
  const total = p.tab_switches + p.fullscreen_exits + p.camera_off;
  const title = ended
    ? "Ended by proctoring"
    : total === 0
    ? "No rule violations"
    : `${total} rule violation${total > 1 ? "s" : ""}`;
  const tone = ended
    ? "bg-error-container text-on-error-container"
    : total === 0
    ? "bg-tertiary-container text-on-tertiary-container"
    : "bg-secondary-container text-on-secondary-fixed";

   const stats = [
    { label: "Tab switches", value: p.tab_switches },
    { label: "Fullscreen exits", value: p.fullscreen_exits },
    { label: "Camera off", value: p.camera_off },
  ];

  return (
    <Card>
      <div className="mb-space-lg flex items-center gap-space-md">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon name={ended ? "gpp_bad" : "security"} className="text-[24px]" />
        </div>
        <div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
          <p className="font-body-sm text-body-sm text-secondary">
            {ended
              ? "The 3rd violation ended the interview. This is a partial report."
              : "The candidate was allowed 2 warnings; a 3rd violation ends the interview."}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-surface-container-low p-space-md">
            <span className="mb-1 block font-label-md text-label-md text-secondary">{s.label}</span>
            <span className="font-headline-md text-headline-md font-bold text-on-surface">{s.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Transcript({ questions }) {
  const [open, setOpen] = useState(new Set([1]));
  const allOpen = open.size === questions.length;

  const toggle = (n) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(questions.map((q) => q.number)));

  return (
    <Card>
      <div className="mb-space-lg flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Question Transcript &amp; Analysis</h2>
          <span className="font-body-sm text-body-sm text-secondary">Each answer with the AI evaluation</span>
        </div>
        <button onClick={toggleAll} className="font-label-md text-label-md font-semibold text-primary">
          {allOpen ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <div className="flex flex-col gap-space-sm">
        {questions.map((q) => {
          const isOpen = open.has(q.number);
          return (
            <div key={q.number} className="rounded-xl bg-surface-container-low p-space-md">
              <button onClick={() => toggle(q.number)} className="flex w-full items-center justify-between text-left">
                <div className="flex items-center gap-space-md">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high font-code-sm text-code-sm font-semibold text-on-surface">
                    Q{q.number}
                  </span>
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">{q.topic}</span>
                </div>
                <div className="flex items-center gap-space-md">
                  <span className="rounded-md bg-tertiary-fixed px-2.5 py-1 font-label-md text-label-md font-bold text-on-tertiary-fixed">
                    {q.score} / 10
                  </span>
                  <Icon name="expand_more" className={`text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isOpen && (
                <div className="mt-space-md space-y-space-sm">
                  <div className="rounded-lg bg-surface-container-lowest p-space-sm">
                    <span className="mb-1 block font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">
                      Question
                    </span>
                    <p className="font-body-md text-body-md text-on-surface">{q.question}</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest p-space-sm">
                    <span className="mb-1 block font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">
                      Candidate answer
                    </span>
                    <p className="font-body-md text-body-md italic text-on-surface">{q.answer}</p>
                  </div>
                  <div className="flex items-start gap-space-sm rounded-lg bg-primary-fixed/20 p-space-sm text-on-surface">
                    <Icon name="smart_toy" className="mt-0.5 text-[18px] text-primary" />
                    <div className="font-body-sm text-body-sm">
                      <strong className="font-semibold text-primary">AI evaluation:</strong> {q.evaluation}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function CandidateEvaluation() {
  const { id } = useParams();
  const [r, setR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notReady, setNotReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setR(null);
    setNotReady(false);

    authFetch(`/interviews/${id}/report`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotReady(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || "Could not load report");
        if (!cancelled) setR(data);
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
  }, [id]);

  if (loading || error || notReady || !r) {
  return (
    <HrLayout>
      <div className="mx-auto max-w-6xl">
        <Link
          to="/hr?view=candidates"
          className="mb-space-md inline-flex items-center gap-space-xs font-label-lg text-label-lg text-secondary transition-colors hover:text-primary"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span>Back to Candidates</span>
        </Link>
        <Card>
          {loading ? (
            <p className="font-body-md text-body-md text-secondary">Loading report...</p>
          ) : notReady ? (
            <div className="flex items-start gap-space-md">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
                <Icon name="hourglass_top" className="text-[24px]" />
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Report is not ready yet</h2>
                <p className="mt-1 font-body-md text-body-md text-secondary">
                  The interview may still be in progress, or the report is still being generated. Please check again in a minute.
                </p>
              </div>
            </div>
          ) : (
            <p className="font-body-md text-body-md text-on-surface">{error}</p>
          )}
        </Card>
      </div>
    </HrLayout>
  );
}

  const a = r.analysis;
  const s = r.scores;

  const dimensions = [
    { label: "Technical Understanding", score: s.technical, note: a.technical_understanding },
    { label: "Communication", score: s.communication, note: a.communication },
    { label: "Coding Round", score: s.coding, note: r.coding?.evaluation },
  ].filter((d) => d.score != null);

  return (
    <HrLayout>
      <div className="mx-auto max-w-6xl">
        <Link
          to="/hr?view=candidates"
          className="mb-space-md inline-flex items-center gap-space-xs font-label-lg text-label-lg text-secondary transition-colors hover:text-primary"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span>Back to Candidates</span>
        </Link>
        {/* Banner */}
        <Card className="!p-space-xl">
          <div className="flex flex-col justify-between gap-space-xl xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-space-lg flex flex-wrap items-center gap-x-space-md gap-y-space-xs">
                <span className="font-headline-xl text-headline-xl font-semibold tracking-tight text-on-surface">
                  {r.job_title ?? "Interview report"}
                </span>
                <span className="rounded-lg bg-surface-container px-space-sm py-0.5 font-label-md text-label-md text-on-surface-variant">
                  Interview ID: {id}
                </span>
              </div>

              <div className="rounded-xl bg-surface-container-low/70 p-space-lg">
                <div className="mb-space-xs flex items-center gap-space-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-on-primary">
                    <Icon name="psychology" className="text-[16px]" />
                  </div>
                  <span className="font-label-lg text-label-lg font-semibold uppercase tracking-wider text-on-surface">
                    Summary
                  </span>
                </div>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface">{a.summary}</p>
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-col items-center rounded-xl bg-surface-container-low p-space-md text-center shadow-sm xl:w-72">
              <span className="mb-1 font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
                Recommendation
              </span>
              <div
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 shadow-sm ${REC_STYLE[a.recommendation]}`}
              >
                <span className="font-headline-sm text-headline-sm font-bold tracking-wide">
                  {a.recommendation.toUpperCase()} ({s.overall_score} / 100)
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Scorecards */}
        <section className="mb-space-lg grid grid-cols-1 gap-space-md md:grid-cols-3">
          {dimensions.map((d) => (
            <div key={d.label} className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
              <span className="mb-space-sm block font-label-lg text-label-lg font-medium text-secondary">{d.label}</span>
              <div className="mb-space-sm flex items-baseline gap-1.5">
                <span className="font-headline-xl text-headline-xl font-bold text-on-surface">{d.score}</span>
                <span className="font-label-lg text-label-lg text-secondary">/ 10</span>
              </div>
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-primary" style={{ width: `${d.score * 10}%` }} />
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{d.note}</span>
            </div>
          ))}
        </section>

        {/* Strengths and gaps */}
        <section className="mb-space-lg grid grid-cols-1 gap-space-lg lg:grid-cols-2">
          <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <SectionHead icon="stars" title="Key Strengths" sub="What the candidate did well" />
            <ul className="flex flex-col gap-space-sm">
              {a.strengths.map((st, i) => (
                <li key={`${st.title}-${i}`} className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
                  <Icon name="check_circle" className="mt-0.5 text-[18px] text-tertiary" />
                  <span className="font-body-md text-body-md leading-snug text-on-surface">
                    <strong>{st.title}:</strong> {st.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <SectionHead icon="explore" title="Gaps to Probe Further" sub="Topics to cover in a follow-up round" />
            <ul className="flex flex-col gap-space-sm">
              {a.gaps.map((g, i) => (
                <li key={`${g.title}-${i}`} className="rounded-lg bg-surface-container-low p-space-md">
                  <div className="mb-1 flex items-center justify-between gap-space-sm">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">{g.title}</span>
                    <span className="rounded-md bg-surface-container px-2 py-0.5 font-label-md text-label-md text-on-surface-variant">
                      {g.kind === "not_covered" ? "Not covered" : "Seen in interview"}
                    </span>
                  </div>
                  <p className="font-body-md text-body-md leading-relaxed text-secondary">{g.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Coding */}
        {r.coding && (
          <section className="mb-space-lg overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            <div className="bg-surface-container-low/40 p-space-lg">
              <span className="mb-1 block font-label-md text-label-md font-semibold uppercase tracking-wider text-secondary">
                Coding Assessment
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface">{r.coding.problem}</h2>
            </div>
            <div className="grid grid-cols-1 bg-inverse-surface text-inverse-on-surface xl:grid-cols-12">
              <div className="overflow-x-auto p-space-lg xl:col-span-8">
                <div className="mb-space-md flex items-center gap-space-sm font-code-sm text-code-sm text-secondary-fixed-dim">
                  <Icon name="code" className="text-[16px] text-tertiary-fixed-dim" />
                  <span>Notepad submission</span>
                </div>
                <pre className="whitespace-pre font-code-sm text-code-sm leading-relaxed">{r.coding.code}</pre>
              </div>
              <div className="flex flex-col gap-space-md bg-inverse-surface/95 p-space-lg xl:col-span-4">
                <div className="rounded-xl bg-surface-container-highest/10 p-space-md">
                  <span className="mb-1 block font-label-md text-label-md font-semibold text-primary-fixed-dim">
                    Spoken explanation
                  </span>
                  <p className="font-body-sm text-body-sm leading-snug text-secondary-fixed-dim">
                    {r.coding.explanation}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-highest/10 p-space-md">
                  <span className="mb-1 block font-label-md text-label-md font-semibold text-primary-fixed-dim">
                    AI evaluation
                  </span>
                  <p className="font-body-sm text-body-sm leading-snug text-secondary-fixed-dim">{r.coding.evaluation}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        <Proctoring p={r.proctoring} ended={r.ended_by_proctoring} />

        <Transcript questions={r.questions} />

        {/* GitHub */}
        {(r.github_url || r.repo_notes) && (
          <Card>
            <div className="flex items-start gap-space-md">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface">
                <Icon name="account_tree" className="text-[28px]" />
              </div>
              <div>
                <h2 className="mb-1 font-headline-sm text-headline-sm text-on-surface">GitHub</h2>
                {r.github_url && (
                  <a
                    href={r.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-code-sm text-code-sm text-primary"
                  >
                    <Icon name="open_in_new" className="text-[16px]" />
                    {r.github_url.replace("https://", "")}
                  </a>
                )}
                {r.repo_notes && (
                  <p className="mt-space-sm max-w-3xl whitespace-pre-line font-body-md text-body-md text-on-surface-variant">
                    {r.repo_notes}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </HrLayout>
  );
}