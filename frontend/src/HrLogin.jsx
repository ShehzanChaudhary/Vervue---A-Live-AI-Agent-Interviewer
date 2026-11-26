import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { getToken, login } from "./auth.js";

const Icon = ({ name, className = "", style }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: 20, ...style }}>{name}</span>
);

export default function HrLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getToken()) return <Navigate to="/hr" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/hr", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-surface px-gutter py-space-xl">
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[380px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary-fixed/35 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 -z-10 h-[280px] w-[420px] rounded-full bg-surface-container/60 blur-2xl" />

      <div className="relative w-full max-w-xl rounded-xl bg-surface-container-lowest p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08),0_1px_3px_0_rgba(15,23,42,0.04)] sm:p-10">
        <div className="absolute inset-x-8 top-0 h-1 rounded-t-xl bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-80" />

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-space-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-low text-primary shadow-[0_4px_12px_rgba(79,70,229,0.08)]">
              <Icon name="neurology" style={{ fontSize: 30, fontVariationSettings: "'FILL' 1" }} />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
              <Icon name="key" style={{ fontSize: 14 }} />
            </div>
          </div>
          <span className="mb-space-xs rounded-full bg-surface-container-low px-space-sm py-0.5 font-label-md text-label-md font-semibold uppercase tracking-wider text-primary">
            HR Portal
          </span>
          <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">AI Interviewer</h1>
          <p className="mt-space-xs max-w-md font-body-md text-body-md text-on-surface-variant">
            Create jobs, share apply links and review candidate reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-space-lg space-y-space-md">
          <div>
            <label className="mb-1.5 block font-label-lg text-label-lg font-medium text-on-surface" htmlFor="work-email">
              Work Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant">
                <Icon name="domain" style={{ fontSize: 18 }} />
              </div>
              <input
                id="work-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.rivera@company.com"
                className="h-11 w-full rounded-lg bg-surface-container-low pl-10 pr-3.5 font-body-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-label-lg text-label-lg font-medium text-on-surface" htmlFor="password-input">
              Account Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-on-surface-variant">
                <Icon name="lock" style={{ fontSize: 18 }} />
              </div>
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-11 w-full rounded-lg bg-surface-container-low pl-10 pr-10 font-body-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/50 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                title="Toggle password view"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant transition-colors hover:text-on-surface focus:outline-none"
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-space-sm flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-container font-label-lg text-label-lg font-semibold text-on-primary shadow-[0_4px_14px_rgba(79,70,229,0.3)] transition-all duration-200 hover:bg-primary hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] active:scale-[0.99] disabled:opacity-60"
          >
            <span>{loading ? "Signing in…" : "Sign in"}</span>
            {!loading && <Icon name="arrow_forward" style={{ fontSize: 18 }} />}
          </button>
        </form>
      </div>
    </div>
  );
}