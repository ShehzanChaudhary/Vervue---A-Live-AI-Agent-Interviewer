import { useRef, useState } from "react";

export function ProblemPanel({ problem }) {
  return (
    <section className="col-span-4 col-start-1 row-start-3 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden min-h-0">
      <div className="flex items-center gap-space-sm px-space-lg pt-space-md pb-space-sm shrink-0">
        <span className="material-symbols-outlined text-primary text-lg">code</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Coding Problem</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-space-lg pb-space-lg">
        <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap break-words">
          {problem}
        </p>
      </div>
    </section>
  );
}

export default function CodeNotepad({ onSubmit }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const gutterRef = useRef(null);

  const lineCount = Math.max(code.split("\n").length, 20);

  // Tab dabane par focus bahar jaane ki jagah 4 spaces aayein
  function handleKeyDown(e) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const el = e.target;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setCode(code.slice(0, start) + "    " + code.slice(end));
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 4;
    });
  }

  // Line numbers editor ke saath scroll hon
  function handleScroll(e) {
    if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(code);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="col-span-8 col-start-5 row-start-2 row-span-2 flex flex-col bg-inverse-surface rounded-xl shadow-xl overflow-hidden min-h-0">
      <div className="flex items-center justify-between px-space-md py-space-sm border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-inverse-on-surface font-label-md text-label-md">
          <span className="material-symbols-outlined text-sm text-primary-fixed">code</span>
          <span>Code editor</span>
        </div>
        <span className="font-code-sm text-code-sm text-outline-variant/60">Tab = 4 spaces</span>
      </div>

      <div className="flex-1 flex min-h-0 font-code-md text-code-md">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 py-space-sm pr-3 text-right select-none overflow-hidden text-outline-variant/40 bg-inverse-surface/80"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          className="flex-1 w-full min-h-0 px-space-sm py-space-sm bg-transparent text-inverse-on-surface font-code-md text-code-md border-0 rounded-none resize-none whitespace-pre overflow-auto focus:outline-none focus:shadow-none placeholder-outline-variant/40 disabled:opacity-60"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder="Write your code here..."
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          disabled={submitting}
        />
      </div>

      <div className="px-space-md py-space-sm border-t border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-space-xs font-label-md text-label-md text-outline-variant">
          <span className="material-symbols-outlined text-sm">mic</span>
          <span>Explain your approach aloud, then press Submit</span>
        </div>
        <button
          type="button"
          className="px-space-lg py-2 bg-primary-container hover:bg-primary disabled:opacity-40 disabled:cursor-not-allowed text-on-primary font-label-lg text-label-lg rounded-lg shadow-md transition-all flex items-center gap-space-xs"
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
        >
          <span>{submitting ? "Submitting..." : "Submit Code"}</span>
          {!submitting && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
        </button>
      </div>
    </section>
  );
}