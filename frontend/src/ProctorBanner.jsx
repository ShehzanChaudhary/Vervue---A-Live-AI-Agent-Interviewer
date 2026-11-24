const MESSAGES = {
  tab_switch: "You left the interview window.",
  fullscreen_exit: "You exited fullscreen.",
  camera_off: "Your camera was turned off.",
};

export default function ProctorBanner({ warning, onDismiss }) {
  if (!warning) return null;

  const text = MESSAGES[warning.type] || "A rule was violated.";

  return (
    <div className="proctor-banner" role="alert">
      <p className="proctor-title">
        Warning {warning.count} of 2: {text}
      </p>
      <p className="proctor-sub">
        {warning.warningsLeft === 1
          ? "1 warning left. The next violation will end the interview."
          : "The next violation will use your last warning."}
      </p>
      <button onClick={onDismiss}>Return to interview</button>
    </div>
  );
}