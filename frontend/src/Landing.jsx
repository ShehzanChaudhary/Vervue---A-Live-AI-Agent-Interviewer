import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-gutter-sm md:p-gutter-lg overflow-hidden bg-surface">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-surface-variant/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_rgba(11,28,48,0.06),0_1px_3px_rgba(11,28,48,0.03)] p-space-xl flex flex-col items-center text-center gap-space-lg">
        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">link</span>
        </div>

        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Open your interview link
          </h1>
          <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Candidates start the interview from the link shared by the hiring team. Please open that
            link to continue.
          </p>
        </div>

        <div className="w-full h-px bg-surface-container-high" />

        <div className="flex flex-col items-center gap-space-sm">
          <span className="font-body-sm text-body-sm text-on-surface-variant">Hiring team?</span>
          <Link
            to="/hr"
            className="px-space-lg py-space-sm bg-primary-container hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg transition-colors"
          >
            Go to HR dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}