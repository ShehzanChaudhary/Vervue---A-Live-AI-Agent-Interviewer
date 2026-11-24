import { useEffect, useState } from "react";

const LEVELS = ["Mid-Level", "Senior", "Staff", "Principal"];

const PROCTOR_RULES = [
  { icon: "tab", title: "Tab switch", text: "Candidate switches to another tab or window." },
  { icon: "fullscreen_exit", title: "Fullscreen exit", text: "Candidate leaves fullscreen mode." },
  { icon: "videocam_off", title: "Camera off", text: "Candidate's camera stops or is blocked." },
];

const INITIAL = { title: "", dept: "", level: "Senior", jd: "", questions: 5 };

const field =
  "w-full rounded-lg bg-surface-container-low px-4 py-2.5 font-body-md text-body-md text-on-surface outline-none transition-all focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container";

function SectionTitle({ n, children }) {
  return (
    <div className="flex items-center gap-space-sm pb-space-xs">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-fixed font-label-md text-label-md font-bold text-on-primary-fixed">
        {n}
      </span>
      <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">{children}</span>
    </div>
  );
}

export default function CreateJobModal({ open, onClose, onPublish }) {
  const [form, setForm] = useState(INITIAL);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const canPublish = form.title.trim() && form.jd.trim();

  const discard = () => {
    setForm(INITIAL);
    onClose();
  };

  const publish = () => {
    onPublish?.({ ...form, title: form.title.trim(), dept: form.dept.trim(), jd: form.jd.trim() });
    setForm(INITIAL);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-inverse-surface/40 p-space-lg backdrop-blur-sm">
      <div className="relative my-auto flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between bg-surface-container-low px-space-xl py-space-lg">
          <div className="flex items-start gap-space-md">
            <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[24px]">work</span>
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-semibold tracking-tight text-on-surface">
                Create Job Requisition
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Set the role, job description and number of questions for this interview.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-space-xl overflow-y-auto px-space-xl py-space-lg">
          {/* 1. Role */}
          <section className="flex flex-col gap-space-md">
            <SectionTitle n={1}>Role &amp; Job Description</SectionTitle>
            <div className="grid grid-cols-12 gap-space-md">
              <div className="col-span-12 flex flex-col gap-1.5 md:col-span-7">
                <label className="font-label-lg text-label-lg font-semibold text-on-surface">Requisition Title</label>
                <input
                  className={field}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Staff Distributed Systems Architect"
                />
              </div>
              <div className="col-span-12 flex flex-col gap-1.5 md:col-span-5">
                <label className="font-label-lg text-label-lg font-semibold text-on-surface">Department</label>
                <input
                  className={field}
                  value={form.dept}
                  onChange={(e) => set("dept", e.target.value)}
                  placeholder="e.g. Core Infrastructure"
                />
              </div>

              <div className="col-span-12 flex flex-col gap-2 pt-1">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">Seniority Level</span>
                <div className="grid grid-cols-2 gap-space-sm md:grid-cols-4">
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => set("level", l)}
                      className={`rounded-lg px-space-md py-2 font-label-lg text-label-lg transition-all ${
                        form.level === l
                          ? "bg-primary-container text-on-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-12 flex flex-col gap-1.5 pt-1">
                <label className="font-label-lg text-label-lg font-semibold text-on-surface">Job Description</label>
                <textarea
                  className={`${field} resize-none leading-relaxed`}
                  rows={6}
                  value={form.jd}
                  onChange={(e) => set("jd", e.target.value)}
                  placeholder="Paste the job description here"
                />
              </div>
            </div>
          </section>

          {/* 2. Interview setup */}
          <section className="flex flex-col gap-space-md">
            <SectionTitle n={2}>Interview Setup</SectionTitle>
            <div className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-md">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">Number of questions</span>
                <span className="rounded bg-surface-container-high px-2 py-0.5 font-code-sm text-code-sm text-on-surface">
                  {form.questions}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                value={form.questions}
                onChange={(e) => set("questions", Number(e.target.value))}
                className="w-full accent-primary-container"
              />
            </div>
          </section>

          {/* 3. Proctoring (read-only) */}
          <section className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <SectionTitle n={3}>Proctoring</SectionTitle>
              <span className="font-label-md text-label-md text-on-surface-variant">Same for every interview</span>
            </div>
            <div className="flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-md">
              <span className="material-symbols-outlined text-[20px] text-primary">verified_user</span>
              <p className="font-body-md text-body-md text-on-surface-variant">
                The candidate gets 2 warnings. The 3rd violation ends the interview and a partial report is saved for
                you.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
              {PROCTOR_RULES.map((r) => (
                <div key={r.title} className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">{r.icon}</span>
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">{r.title}</span>
                  </div>
                  <span className="font-body-sm text-body-sm leading-tight text-on-surface-variant">{r.text}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-end gap-space-md bg-surface-container-low px-space-xl py-space-md">
          <button
            type="button"
            onClick={discard}
            className="h-10 rounded-xl bg-surface-container-lowest px-space-lg font-label-lg text-label-lg text-on-surface shadow-sm transition-all hover:bg-surface-container"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={!canPublish}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary-container px-space-xl font-label-lg text-label-lg font-semibold text-on-primary shadow-md transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            <span>Publish Requisition</span>
          </button>
        </div>
      </div>
    </div>
  );
}