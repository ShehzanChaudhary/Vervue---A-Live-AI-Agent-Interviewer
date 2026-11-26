const BRAND = "AI Interviewer"; // yahan apna product name daal do

export default function AppHeader({ view }) {
  const inSession = view === "check" || view === "interview";

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 w-full px-gutter-lg flex items-center justify-between">
        <div className="flex items-center gap-space-md">
          <span className="material-symbols-outlined text-2xl text-primary">graphic_eq</span>

          {inSession ? (
            <span className="font-headline-sm text-headline-sm text-on-surface">{BRAND}</span>
          ) : (
            <a href="/" className="font-headline-sm text-headline-sm text-on-surface">{BRAND}</a>
          )}

          {inSession && (
            <>
              <span className="h-4 w-px bg-outline-variant mx-space-xs" />
              <span className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low text-tertiary rounded-full font-label-md text-label-md">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                Proctored Session
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}