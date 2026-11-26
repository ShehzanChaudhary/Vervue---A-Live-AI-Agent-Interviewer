import { useRef, useState, useEffect } from "react";

const inputClass =
  "w-full px-space-md py-2.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-outline/70 shadow-sm";

const labelClass = "font-label-lg text-label-lg text-on-surface font-medium";

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StartForm({ onSubmit, status, publicId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [job, setJob] = useState(null);
  const [jobError, setJobError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadJob() {
      try {
        const res = await fetch(`/public/jobs/${encodeURIComponent(publicId)}`);
        if (res.status === 404) throw new Error("This interview link is not valid.");
        if (res.status === 409) throw new Error("This job is no longer accepting interviews.");
        if (!res.ok) throw new Error("Could not load the job. Please try again.");
        const data = await res.json();
        if (!cancelled) setJob(data);
      } catch (err) {
        if (!cancelled) setJobError(err.message);
      }
    }
    loadJob();
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  async function handle(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("public_id", publicId);
      await onSubmit(formData);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  function removeFile() {
    if (fileRef.current) fileRef.current.value = "";
    setFile(null);
  }

  if (jobError) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-gutter-sm bg-surface">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-sm p-space-xl text-center">
          <p className="font-label-lg text-label-lg text-on-surface font-semibold" role="alert">{jobError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-gutter-sm md:p-gutter-lg overflow-hidden bg-surface">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-surface-variant/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-[0_20px_50px_rgba(11,28,48,0.06),0_1px_3px_rgba(11,28,48,0.03)] p-space-md sm:p-space-xl flex flex-col gap-space-lg my-space-md">
        {/* Step indicator */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-container text-on-primary font-label-md text-label-md">
                1
              </span>
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">Your details</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface-variant">Step 1 of 2</span>
          </div>
          <div className="w-full grid grid-cols-2 gap-space-xs h-1.5 mt-1">
            <div className="bg-primary rounded-full h-full" />
            <div className="bg-surface-container-high rounded-full h-full" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            {job ? job.title : "Loading..."}
          </h1>
          {job?.department && (
            <p className="font-label-lg text-label-lg text-on-surface-variant mt-1">{job.department}</p>
          )}
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
            We use your details and resume to tailor the questions to you and the role.
          </p>
        </div>

        <form className="flex flex-col gap-space-lg" onSubmit={handle}>
          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="name">Full name</label>
              <div className="relative">
                <input id="name" name="name" required autoComplete="name" placeholder="e.g. Sarah Lin" className={inputClass} />
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant/40 text-lg pointer-events-none">badge</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="email">Email address</label>
              <div className="relative">
                <input id="email" name="email" type="email" required autoComplete="email" placeholder="name@example.com" className={inputClass} />
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant/40 text-lg pointer-events-none">alternate_email</span>
              </div>
            </div>
          </div>

          {/* Resume */}
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className={labelClass}>Resume</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">PDF or DOCX</span>
            </div>

            <div className="relative rounded-xl bg-surface-container-low p-space-md transition-all hover:bg-surface-container/60 shadow-sm">
              {/* Ek hi input hamesha mounted rehta hai, state sirf uska look badalti hai */}
              <input
                ref={fileRef}
                name="resume"
                type="file"
                accept=".pdf,.docx"
                required
                onChange={(e) => setFile(e.target.files[0] || null)}
                className={file ? "hidden" : "absolute inset-0 w-full h-full opacity-0 cursor-pointer"}
              />

              {!file ? (
                <div className="flex flex-col items-center justify-center gap-space-xs py-space-md text-center pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">upload_file</span>
                  </div>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">Drop your resume here or browse</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">PDF or DOCX</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">{file.name}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{formatSize(file.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-sm shrink-0">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                      Replace
                    </button>
                    <button
                      type="button"
                      aria-label="Remove uploaded resume"
                      onClick={removeFile}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monitoring notice */}
          <div className="rounded-xl bg-surface-container p-space-md flex items-start gap-space-md shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-label-lg text-label-lg text-on-surface font-semibold">This interview is monitored</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Your camera must stay on and the interview runs in fullscreen. Leaving the tab or fullscreen, or turning off your camera, counts as a violation. You get 2 warnings; the 3rd ends the interview.
              </p>
            </div>
          </div>

          {error && (
            <p
              className="px-space-md py-space-sm rounded-xl bg-error-container text-on-error-container font-label-lg text-label-lg"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="flex flex-col gap-space-sm">
            <button
              type="submit"
              disabled={loading || !job}
              className="group w-full h-12 px-space-lg rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg font-medium flex items-center justify-center gap-space-sm shadow-[0_4px_14px_rgba(79,70,229,0.3)] hover:opacity-95 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-on-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Preparing your interview</span>
                </>
              ) : (
                <>
                  <span>Continue to device check</span>
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                </>
              )}
            </button>
            {loading && (
              <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
                {status || "Reading your resume and the job description. This can take a minute."}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}