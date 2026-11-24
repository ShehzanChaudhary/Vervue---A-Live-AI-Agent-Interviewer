import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import CreateJobModal from "./CreateJobModal.jsx";

const Icon = ({ name, className = "" }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 20 }}>{name}</span>
);

// to: jis route par jaana hai. Jis page abhi nahi bane, unme to nahi hai (disabled dikhte hain)
const NAV = [
  { label: "Jobs", icon: "work", to: "/hr", match: (p) => p === "/hr" },
  { label: "Candidates", icon: "groups", to: "/hr", match: (p) => p.startsWith("/hr/candidates") },
  { label: "Analytics", icon: "monitoring" },
  { label: "Settings", icon: "settings" },
  { label: "Help", icon: "help" },
];

function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] md:flex">
      <div>
        <div className="flex h-16 items-center gap-space-sm px-space-lg">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <Icon name="neurology" />
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm leading-tight tracking-tight text-on-surface">AI Interviewer</span>
            <span className="font-label-md text-label-md font-medium uppercase tracking-wider text-on-surface-variant">Talent Ops</span>
          </div>
        </div>

        <nav className="flex flex-col gap-space-xs px-space-md pt-space-md">
          {NAV.map((n) => {
            const active = n.match?.(pathname);
            const base = "flex items-center gap-space-md rounded-xl px-space-md py-space-sm font-label-lg text-label-lg transition-all";

            if (!n.to) {
              return (
                <button key={n.label} disabled className={`${base} cursor-not-allowed text-on-surface-variant opacity-50`}>
                  <Icon name={n.icon} /> {n.label}
                </button>
              );
            }
            return (
              <Link
                key={n.label}
                to={n.to}
                className={`${base} ${
                  active
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <Icon name={n.icon} /> {n.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-space-md">
        <div className="flex items-center gap-space-md rounded-xl bg-surface-container-low p-space-md">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary">
            <Icon name="person" className="text-on-primary" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-label-lg text-label-lg font-semibold text-on-surface">Alex Rivera</span>
            <span className="truncate font-body-sm text-body-sm text-on-surface-variant">Head of Technical Talent</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function HrLayout({ children }) {
  const [showCreate, setShowCreate] = useState(false);

  const handlePublish = (job) => {
    console.log("publish requisition (mock)", job); // backend step 3 mein jodenge
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-space-lg bg-surface-container-lowest/90 px-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="relative max-w-xl flex-1">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="w-full rounded-xl bg-surface-container-low py-space-sm pl-10 pr-4 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:bg-surface-container-lowest"
              placeholder="Search candidates, job requisitions…"
              type="text"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex h-10 items-center gap-space-sm rounded-xl bg-primary-container px-space-lg font-label-lg text-label-lg text-on-primary shadow-sm transition-all hover:bg-primary"
          >
            <Icon name="add" />
            <span>Create Job</span>
          </button>
        </header>

        <main className="px-space-xl py-space-lg">{children}</main>
      </div>

      <CreateJobModal open={showCreate} onClose={() => setShowCreate(false)} onPublish={handlePublish} />
    </div>
  );
}