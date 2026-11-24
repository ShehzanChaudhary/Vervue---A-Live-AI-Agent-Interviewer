const FEATURES = [
  {
    icon: "record_voice_over",
    iconClass: "text-primary",
    title: "AI Interviewer",
    text: "Questions are based on your resume and the job description, and each follow-up builds on your last answer.",
    tag: "Conversational, voice-first",
    tagClass: "text-primary",
  },
  {
    icon: "code_blocks",
    iconClass: "text-primary",
    title: "Live Coding Round",
    text: "Write code in the browser while you explain your approach aloud. Submit once and it is reviewed together with your explanation.",
    tag: "Explain aloud, submit once",
    tagClass: "text-primary",
  },
  {
    icon: "gavel",
    iconClass: "text-tertiary",
    title: "Proctored Session",
    text: "Tab switches, leaving fullscreen and turning off the camera are tracked. You get 2 warnings before the session ends.",
    tag: "2 warnings, then the session ends",
    tagClass: "text-tertiary",
  },
];

const STEPS = [
  { icon: "upload_file", title: "Share your details", text: "Add your name, email, the job description and your resume (PDF or DOCX)." },
  { icon: "videocam", title: "Check your setup", text: "Allow camera access, read the rules and enter fullscreen." },
  { icon: "forum", title: "Talk to the interviewer", text: "Answer out loud. The hiring team reviews your responses afterwards." },
];

const SAMPLE_CODE = `def is_palindrome(s: str) -> bool:
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]`;

export default function Landing({ onStart }) {
  return (
    <div className="flex flex-col w-full bg-surface">
      {/* Hero */}
      <section className="relative w-full overflow-hidden px-margin-lg py-space-xl">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[780px] h-[360px] bg-gradient-to-b from-primary-fixed/35 via-surface-container/20 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-tertiary-fixed/20 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-low text-primary shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label-md text-label-md uppercase tracking-wider">AI-led technical screening</span>
          </div>

          <h1 className="mt-space-lg font-display-lg text-display-lg text-on-surface max-w-4xl tracking-tight">
            Interviews that{" "}
            <span className="bg-gradient-to-r from-primary to-surface-tint bg-clip-text text-transparent">run themselves</span>
          </h1>

          <p className="mt-space-md max-w-3xl font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            A first-round technical interview led by an AI interviewer: questions from your resume, a live coding round
            and a proctored session. Your responses go to the hiring team for review.
          </p>

          <div className="mt-space-xl flex flex-wrap items-center justify-center gap-space-md">
            <button
              type="button"
              className="group inline-flex items-center justify-center gap-space-sm px-space-xl py-3.5 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={onStart}
            >
              <span>Start Interview</span>
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 bg-surface-container-lowest text-on-surface-variant font-label-lg text-label-lg rounded-xl shadow-sm opacity-60 cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base text-secondary">domain</span>
              <span>Company Portal Login</span>
            </button>
          </div>

          <p className="mt-space-md font-body-sm text-body-sm text-on-surface-variant">
            Camera and microphone required.
          </p>
        </div>

        {/* Sample session preview */}
        <div className="relative max-w-6xl mx-auto mt-space-xl pt-space-md">
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden p-space-md md:p-space-lg">
            <div className="flex items-center justify-between pb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-error/70" />
                  <span className="w-3 h-3 rounded-full bg-outline-variant/60" />
                  <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim" />
                </div>
                <span className="ml-space-sm font-label-md text-label-md text-on-surface-variant">Sample session</span>
              </div>
              <span className="px-space-sm py-1 bg-surface-container-low text-tertiary rounded-full font-label-md text-label-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" /> Live
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
              <div className="lg:col-span-5 flex flex-col gap-space-md">
                <div className="relative bg-inverse-surface rounded-xl overflow-hidden shadow-md aspect-video flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary-fixed-dim">smart_toy</span>
                  <span className="absolute top-space-sm left-space-sm bg-surface-container-lowest/20 backdrop-blur-md px-space-sm py-1 rounded text-inverse-on-surface font-label-md text-label-md">
                    AI Interviewer
                  </span>
                </div>
                <div className="p-space-md bg-surface-container-low rounded-xl">
                  <span className="font-label-md text-label-md text-primary font-semibold">Follow-up question</span>
                  <p className="mt-1.5 font-body-md text-body-md text-on-surface leading-snug">
                    “You mention a 30–40% drop in LLM calls. How did you measure it?”
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 bg-inverse-surface rounded-xl overflow-hidden flex flex-col shadow-md">
                <div className="flex items-center justify-between px-space-md py-space-sm text-inverse-on-surface">
                  <span className="font-code-sm text-code-sm text-primary-fixed-dim font-medium">Code editor</span>
                  <span className="font-code-sm text-code-sm text-outline-variant/60">Tab = 4 spaces</span>
                </div>
                <pre className="flex-1 p-space-md font-code-sm text-code-sm leading-relaxed overflow-x-auto text-inverse-on-surface">
                  {SAMPLE_CODE}
                </pre>
                <div className="px-space-md py-space-sm bg-black/30 flex items-center gap-space-xs font-label-md text-label-md text-outline-variant">
                  <span className="material-symbols-outlined text-sm">mic</span>
                  <span>Explain your approach aloud, then press Submit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full px-margin-lg py-space-xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-space-xl">
            <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">What to expect</span>
            <h2 className="mt-space-xs font-headline-xl text-headline-xl text-on-surface">A conversation, not a multiple-choice test</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {FEATURES.map((f) => (
              <div key={f.title} className="group bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className={"w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center group-hover:scale-110 transition-transform " + f.iconClass}>
                    <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                  </div>
                  <h3 className="mt-space-md font-headline-md text-headline-md text-on-surface">{f.title}</h3>
                  <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">{f.text}</p>
                </div>
                <div className="mt-space-lg pt-space-md bg-surface-container-low/60 -mx-space-lg -mb-space-lg p-space-md rounded-b-2xl">
                  <span className={"font-label-md text-label-md font-semibold " + f.tagClass}>{f.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full px-margin-lg py-space-xl bg-surface-container-low/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-space-xl">
            <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">How it works</span>
            <h2 className="mt-space-xs font-headline-xl text-headline-xl text-on-surface">Three steps to start</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
            {STEPS.map((s, i) => (
              <div key={s.title} className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg">{i + 1}</span>
                  <span className="material-symbols-outlined text-primary">{s.icon}</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{s.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-space-xl flex justify-center">
            <button
              type="button"
              className="px-space-xl py-3.5 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-xl shadow-md transition-colors"
              onClick={onStart}
            >
              Start Interview
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}