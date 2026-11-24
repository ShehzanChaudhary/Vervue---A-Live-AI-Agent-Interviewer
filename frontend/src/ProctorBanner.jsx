const MESSAGES = {
  tab_switch: "You left the interview window.",
  fullscreen_exit: "You exited fullscreen.",
  camera_off: "Your camera was turned off.",
};

const ACTIONS = {
  tab_switch: "Return to interview",
  fullscreen_exit: "Return to fullscreen",
  camera_off: "Turn camera back on",
};

export default function ProctorBanner({ warning, onDismiss }) {
  if (!warning) return null;

  const text = MESSAGES[warning.type] || "A rule was violated.";
  const action = ACTIONS[warning.type] || "Return to interview";
  const lastWarning = warning.warningsLeft === 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-space-md bg-inverse-surface/60 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="proctor-title"
    >
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_rgba(11,28,48,0.25)] p-space-xl flex flex-col items-center text-center gap-space-md">
        <div
          className={
            "w-14 h-14 rounded-full flex items-center justify-center " +
            (lastWarning ? "bg-error-container text-error" : "bg-surface-container text-primary")
          }
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            warning
          </span>
        </div>

        <div className="flex flex-col gap-space-xs">
          <h2 id="proctor-title" className="font-headline-md text-headline-md text-on-surface">
            Warning {warning.count} of 2
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface">{text}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 1].map((i) => (
            <span
              key={i}
              className={"w-2.5 h-2.5 rounded-full " + (i < warning.count ? "bg-error" : "bg-outline-variant")}
            />
          ))}
        </div>

        <p
          className={
            "w-full px-space-md py-space-sm rounded-xl font-body-sm text-body-sm " +
            (lastWarning ? "bg-error-container text-on-error-container" : "bg-surface-container-low text-on-surface-variant")
          }
        >
          {lastWarning
            ? "1 warning left. The next violation will end the interview."
            : "The next violation will use your last warning."}
        </p>

        <button
          type="button"
          autoFocus
          onClick={onDismiss}
          className="w-full h-12 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-medium shadow-[0_4px_14px_rgba(79,70,229,0.3)] active:scale-[0.99] transition-all"
        >
          {action}
        </button>
      </div>
    </div>
  );
}