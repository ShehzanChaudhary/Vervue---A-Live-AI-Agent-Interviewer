import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import HrLayout from "./HrLayout.jsx";

// Mock data. Real report ka shape aane par yahan se replace hoga.
const REPORT = {
  name: "Sarah Lin",
  role: "Senior Distributed Systems Architect",
  completedAt: "Today, 3:42 PM",
  duration: "44m 18s",
  endedByProctoring: false,
  score: 94,
  recommendation: "Strong Hire",
  summary:
    "Candidate showed strong command of distributed consensus, event streaming and concurrency. The coding solution was correct and used a bounded min-heap. Communication was clear and well structured throughout the interview.",
  dimensions: [
    { label: "Technical Understanding", score: 9.6, note: "Accurate and deep answers across all topics" },
    { label: "Communication", score: 9.2, note: "Clear, structured and calm explanations" },
    { label: "Coding Round", score: 9.5, note: "Correct approach with a clear explanation" },
  ],
  strengths: [
    { title: "Bounded ingestion", text: "Used a bounded min-heap for stream ingestion and explained why it beats a full sort." },
    { title: "Kafka trade-offs", text: "Explained log compaction vs state stores with clear idempotency guarantees." },
    { title: "Edge cases", text: "Checked boundary conditions and the empty-stream case before being asked." },
  ],
  gaps: [
    {
      title: "Split-brain handling",
      text: "Stated the quorum requirement correctly but did not get to pre-vote phases or epoch fencing.",
    },
    {
      title: "Mentorship experience",
      text: "Not covered in this interview. Worth exploring in a later round.",
    },
  ],
  coding: {
    problem: "Stream Top-K Frequent Elements",
    language: "Python",
    code: `import heapq
from collections import Counter

def top_k_frequent(nums, k):
    count = Counter(nums)
    min_heap = []
    for val, freq in count.items():
        heapq.heappush(min_heap, (freq, val))
        if len(min_heap) > k:
            heapq.heappop(min_heap)
    return [val for freq, val in sorted(min_heap, reverse=True)]`,
    explanation:
      "I count frequencies first, then keep a min-heap of size k so the least frequent element is dropped whenever the heap grows beyond k.",
    evaluation:
      "Correct and efficient. Avoided the naive full sort and explained the O(N log k) bound clearly.",
  },
  proctoring: { tabSwitches: 0, fullscreenExits: 0, cameraOff: 0 },
  questions: [
    {
      n: 1,
      topic: "System topology and ingestion architecture",
      score: 9.5,
      answer:
        "To isolate the ingress layer from database write saturation, we place a partitioned streaming buffer upstream and push to Kafka partitions keyed on tenant id.",
      evaluation: "Strong grasp of serialization cost and memory pressure. Mentioned TLS termination limits at the edge.",
    },
    {
      n: 2,
      topic: "Raft log replication",
      score: 9.2,
      answer:
        "The leader appends the command to its log and sends AppendEntries in parallel. An entry commits once a majority has it. Randomized election timeouts reduce split votes.",
      evaluation: "Clear explanation. Only gap was skipping pre-vote phases for bad network splits.",
    },
    {
      n: 3,
      topic: "Distributed state with Kafka",
      score: 9.7,
      answer:
        "I would use idempotent producers and the transactional outbox pattern to avoid dual-write inconsistency between the database and Kafka.",
      evaluation: "Good awareness of dual-write pitfalls and the cost of two-phase commit.",
    },
    {
      n: 4,
      topic: "Coding question",
      score: 9.5,
      answer: "Submitted code from the notepad and explained the bounded min-heap approach aloud.",
      evaluation: "Correct solution with clean structure and clear variable names.",
    },
  ],
  resume: {
    file: "sarah_lin_resume.pdf",
    github: "https://github.com/slin-systems",
    notes:
      "Candidate contributes to open-source log and storage projects. Technical depth in the interview matched the public repositories.",
  },
};

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
  const total = p.tabSwitches + p.fullscreenExits + p.cameraOff;
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
    { label: "Tab switches", value: p.tabSwitches },
    { label: "Fullscreen exits", value: p.fullscreenExits },
    { label: "Camera off", value: p.cameraOff },
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

  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(questions.map((q) => q.n)));

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
          const isOpen = open.has(q.n);
          return (
            <div key={q.n} className="rounded-xl bg-surface-container-low p-space-md">
              <button onClick={() => toggle(q.n)} className="flex w-full items-center justify-between text-left">
                <div className="flex items-center gap-space-md">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high font-code-sm text-code-sm font-semibold text-on-surface">
                    Q{q.n}
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
  const { id } = useParams(); // abhi mock data hai, backend jodne par isse report fetch hoga
  const r = REPORT;

   return (
    <HrLayout>
      <div className="mx-auto max-w-6xl">
        <Link
          to="/hr"
          className="mb-space-md inline-flex items-center gap-space-xs font-label-lg text-label-lg text-secondary transition-colors hover:text-primary"
        >
          <Icon name="arrow_back" className="text-[18px]" />
          <span>Back to Candidates</span>
        </Link>
        {/* Banner */}
        <Card className="!p-space-xl">
          <div className="flex flex-col justify-between gap-space-xl xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-space-xs flex flex-wrap items-center gap-x-space-md gap-y-space-xs">
                <span className="font-headline-xl text-headline-xl font-semibold tracking-tight text-on-surface">
                  {r.name}
                </span>
                <span className="rounded-lg bg-surface-container px-space-sm py-0.5 font-label-md text-label-md text-on-surface-variant">
                  Interview ID: {id}
                </span>
              </div>
              <div className="mb-space-lg flex flex-wrap items-center gap-x-space-md gap-y-1 font-body-sm text-body-sm text-secondary">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">{r.role}</span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <Icon name="event" className="text-[15px]" />
                  {r.endedByProctoring ? "Ended" : "Completed"} {r.completedAt}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1">
                  <Icon name="schedule" className="text-[15px]" />
                  {r.duration}
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
                <p className="font-body-md text-body-md leading-relaxed text-on-surface">{r.summary}</p>
              </div>
            </div>

            <div className="flex flex-shrink-0 flex-col items-center rounded-xl bg-surface-container-low p-space-md text-center shadow-sm xl:w-72">
              <span className="mb-1 font-label-md text-label-md font-semibold uppercase tracking-widest text-secondary">
                Recommendation
              </span>
              <div
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 shadow-sm ${REC_STYLE[r.recommendation]}`}
              >
                <span className="font-headline-sm text-headline-sm font-bold tracking-wide">
                  {r.recommendation.toUpperCase()} ({r.score} / 100)
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Scorecards */}
        <section className="mb-space-lg grid grid-cols-1 gap-space-md md:grid-cols-3">
          {r.dimensions.map((d) => (
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
              {r.strengths.map((s) => (
                <li key={s.title} className="flex items-start gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
                  <Icon name="check_circle" className="mt-0.5 text-[18px] text-tertiary" />
                  <span className="font-body-md text-body-md leading-snug text-on-surface">
                    <strong>{s.title}:</strong> {s.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm">
            <SectionHead icon="explore" title="Gaps to Probe Further" sub="Topics to cover in a follow-up round" />
            <ul className="flex flex-col gap-space-sm">
              {r.gaps.map((g) => (
                <li key={g.title} className="rounded-lg bg-surface-container-low p-space-md">
                  <div className="mb-1 font-label-lg text-label-lg font-semibold text-on-surface">{g.title}</div>
                  <p className="font-body-md text-body-md leading-relaxed text-secondary">{g.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Coding */}
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
                <span>{r.coding.language}</span>
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

        <Proctoring p={r.proctoring} ended={r.endedByProctoring} />

        <Transcript questions={r.questions} />

        {/* Resume and GitHub */}
        <Card>
          <div className="flex items-start gap-space-md">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container text-on-surface">
              <Icon name="account_tree" className="text-[28px]" />
            </div>
            <div>
              <h2 className="mb-1 font-headline-sm text-headline-sm text-on-surface">Resume &amp; GitHub</h2>
              <div className="flex flex-wrap items-center gap-x-space-md gap-y-1 font-body-sm text-body-sm text-secondary">
                <span className="flex items-center gap-1 font-medium text-on-surface">
                  <Icon name="description" className="text-[16px]" />
                  {r.resume.file}
                </span>
                {r.resume.github && (
                  <>
                    <span className="text-outline-variant">•</span>
                    <a
                      href={r.resume.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-code-sm text-code-sm text-primary"
                    >
                      <Icon name="open_in_new" className="text-[16px]" />
                      {r.resume.github.replace("https://", "")}
                    </a>
                  </>
                )}
              </div>
              <p className="mt-space-sm max-w-3xl font-body-md text-body-md text-on-surface-variant">{r.resume.notes}</p>
            </div>
          </div>
        </Card>
      </div>
    </HrLayout>
  );
}