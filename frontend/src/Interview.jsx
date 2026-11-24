import { useEffect, useRef, useState } from "react";
import CodeNotepad, { ProblemPanel } from "./CodeNotepad.jsx";

function formatTime(total) {
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function Interview({
  status, connected, progress, lines, report, ended,
  onEnd, onRepeat, problem, onSubmitCode, proctor,
}) {
  const selfRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  const completed = !!report;
  const finished = ended || completed;
  const coding = !!problem && !finished;
  const warningsUsed = Math.min(proctor.violations.length, 2);
  const lastLine = lines[lines.length - 1];

  useEffect(() => {
    if (selfRef.current) selfRef.current.srcObject = proctor.stream;
  }, [proctor.stream]);

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [finished]);

  const pillLabel = completed ? "Completed" : ended ? "Ended" : `Question ${progress.n} of ${progress.max}`;

  const containerClass = coding
    ? "max-w-7xl mx-auto w-full px-gutter-lg py-space-md grid grid-cols-12 grid-rows-[auto_auto_minmax(0,1fr)] gap-space-md h-[calc(100vh-4rem)]"
    : "max-w-7xl mx-auto w-full px-gutter-lg py-space-md flex flex-col gap-space-md";

  const avatarClass =
    "relative overflow-hidden bg-inverse-surface " +
    (coding
      ? "col-span-4 col-start-1 row-start-2 aspect-video rounded-xl shadow-md"
      : "w-full aspect-video max-h-[620px] rounded-xl shadow-xl") +
    (ended ? " hidden" : "");

  return (
    <div className={containerClass}>
      {/* Top ribbon */}
      <div className="col-span-12 row-start-1 bg-surface-container-lowest rounded-xl shadow-sm px-space-lg py-space-sm flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs px-space-md py-1 bg-surface-container rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="font-label-md text-label-md text-on-surface">{pillLabel}</span>
          </div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-code-md text-code-md">
            <span className="material-symbols-outlined text-sm text-secondary">timer</span>
            <span className="font-medium tracking-tight">{formatTime(seconds)}</span>
            <span className="font-body-sm text-body-sm text-secondary">elapsed</span>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          {!finished && (
            <div className="flex items-center gap-space-xs px-space-md py-1 bg-surface-container-low rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
              </span>
              <span className="font-label-md text-label-md text-tertiary font-semibold">Monitoring active</span>
            </div>
          )}

          <div className="flex items-center gap-space-xs px-space-md py-1 bg-surface-container-low rounded-full">
            <span className="font-label-md text-label-md text-secondary">Warnings: {warningsUsed}/2</span>
            <div className="flex items-center gap-1 ml-1">
              {[0, 1].map((i) => (
                <span key={i} className={"w-2 h-2 rounded-full " + (i < warningsUsed ? "bg-error" : "bg-outline-variant")} />
              ))}
            </div>
          </div>

          {!finished && (
            <>
              <button
                type="button"
                className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed font-label-lg text-label-lg transition-colors"
                onClick={onRepeat}
                disabled={!connected}
              >
                <span className="material-symbols-outlined text-lg text-secondary">replay</span>
                <span>Repeat question</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg text-error hover:bg-error-container font-label-lg text-label-lg transition-colors"
                onClick={onEnd}
              >
                <span className="material-symbols-outlined text-lg">call_end</span>
                <span>End session</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Avatar: ye wahi element rehta hai, sirf class badalti hai (remount hua to Anam stream toot jayegi) */}
      <div className={avatarClass}>
        <video id="avatar" autoPlay playsInline className="w-full h-full object-cover" />

        {!coding && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/70 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-space-md left-space-md flex items-center gap-space-sm px-space-md py-space-xs bg-inverse-surface/85 backdrop-blur-md rounded-full shadow-sm text-inverse-on-surface">
              <span className={"w-2 h-2 rounded-full " + (connected ? "bg-tertiary-fixed animate-pulse" : "bg-outline")} />
              <span className="font-label-lg text-label-lg font-semibold">{connected ? "AI Interviewer" : "Connecting..."}</span>
            </div>

            {lastLine && (
              <div className="absolute bottom-space-lg inset-x-space-lg">
                <div className="max-w-4xl mx-auto bg-inverse-surface/90 backdrop-blur-xl rounded-xl p-space-md shadow-2xl text-inverse-on-surface flex items-start gap-space-md">
                  <div className="p-2 rounded-lg bg-primary-container text-on-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-lg">forum</span>
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-label-md text-label-md text-secondary-fixed uppercase tracking-wider font-semibold">
                      {lastLine.who}
                    </span>
                    <p className="font-body-lg text-body-lg font-medium leading-relaxed max-h-40 overflow-y-auto">
                      {lastLine.text}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Candidate self-view (asli webcam) */}
        <div
          className={
            "absolute overflow-hidden bg-inverse-surface shadow-2xl aspect-[4/3] " +
            (coding ? "top-2 right-2 w-20 rounded-md" : "top-space-md right-space-md w-48 sm:w-56 rounded-lg") +
            (proctor.stream ? "" : " hidden")
          }
        >
          <video ref={selfRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          {!coding && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-inverse-surface/90 to-transparent p-space-xs flex items-center gap-1 text-inverse-on-surface">
              <span className="material-symbols-outlined text-xs text-tertiary-fixed">videocam</span>
              <span className="font-label-md text-label-md">You</span>
            </div>
          )}
        </div>

        {coding && lastLine && (
          <div className="absolute bottom-0 inset-x-0 bg-inverse-surface/85 text-inverse-on-surface font-body-sm text-body-sm p-space-sm line-clamp-2">
            {lastLine.text}
          </div>
        )}
      </div>

      {/* Coding round */}
      {coding && <ProblemPanel problem={problem} />}
      {coding && <CodeNotepad key={problem} onSubmit={onSubmitCode} />}

      {/* Status dock */}
      {!coding && !finished && (
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-md flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl">mic</span>
          </div>
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{status}</span>
            {connected && <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />}
          </div>
        </div>
      )}

      {/* Completion / ended */}
      {finished && (
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-xl flex flex-col items-center text-center gap-space-md">
          <span className={"material-symbols-outlined text-4xl " + (completed ? "text-tertiary" : "text-error")}>
            {completed ? "check_circle" : "info"}
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {completed ? "Interview complete" : "Interview ended"}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            {completed ? "Thank you for your time. Your responses have been submitted." : status}
          </p>
          <button
            type="button"
            className="px-space-lg py-space-sm bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg transition-colors"
            onClick={() => location.reload()}
          >
            Back to home
          </button>
        </div>
      )}
    </div>
  );
}