import { useEffect, useRef, useState } from "react";

const RULES = [
  { icon: "fullscreen_exit", title: "Stay in fullscreen mode", text: "Remain in fullscreen for the whole interview." },
  { icon: "tab", title: "No tab switching", text: "Do not switch tabs or minimize the window." },
  { icon: "visibility", title: "Keep your camera on", text: "Your camera must stay on until the interview ends." },
];

export default function CheckScreen({ proctor, interviewId, status, onBegin }) {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [cameraError, setCameraError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [starting, setStarting] = useState(false);

  const track = proctor.stream?.getVideoTracks()[0];
  const settings = track ? track.getSettings() : null;
  const cameraOk = !!track && track.readyState === "live";

  async function loadCamera(deviceId) {
    setCameraError("");
    const result = await proctor.startCamera(deviceId);
    if (!result.ok) {
      setCameraError(result.error);
      return;
    }
    const all = await navigator.mediaDevices.enumerateDevices();
    setDevices(all.filter((d) => d.kind === "videoinput"));
  }

  useEffect(() => {
    loadCamera();
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = proctor.stream;
  }, [proctor.stream]);

  async function handleBegin() {
    setStarting(true);
    await onBegin();
    setStarting(false);
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-gutter-sm sm:px-gutter lg:px-gutter-lg py-space-lg sm:py-space-xl">
      {/* Top: heading + step pill */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
        <div>
          <div className="flex items-center gap-space-xs text-primary font-label-md text-label-md uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            Verification Protocol
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">Step 2 of 2: Setup &amp; Environment Check</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Check that your camera works and read the proctoring rules before you begin.
          </p>
        </div>
        <div className="flex items-center gap-space-sm bg-surface-container-lowest shadow-sm px-space-md py-space-sm rounded-xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-tertiary-fixed text-tertiary">
              <span className="material-symbols-outlined text-sm">check</span>
            </span>
            <span className="font-label-lg text-label-lg text-on-surface-variant line-through">Details</span>
          </div>
          <span className="w-4 h-px bg-outline-variant" />
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-container text-on-primary font-label-md text-label-md">2</span>
            <span className="font-label-lg text-label-lg text-on-surface font-semibold">Device &amp; Rules</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
        {/* LEFT: camera */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container-low text-primary">
                  <span className="material-symbols-outlined text-lg">videocam</span>
                </span>
                <div>
                  <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">Camera Preview</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">This is what the proctor sees</p>
                </div>
              </div>
              {cameraOk && (
                <div className="flex items-center gap-space-xs px-space-sm py-1 bg-surface-container-low text-tertiary rounded-full font-label-md text-label-md">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                  Camera Live
                </div>
              )}
            </div>

            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-inverse-surface shadow-inner">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
              {!cameraOk && (
                <div className="absolute inset-0 flex items-center justify-center text-inverse-on-surface font-body-md text-body-md text-center px-space-md">
                  {cameraError || "Starting camera..."}
                </div>
              )}
              {settings && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-end gap-2 bg-inverse-surface/80 backdrop-blur-md text-inverse-on-surface p-space-sm rounded-lg">
                  <span className="font-code-sm text-code-sm bg-surface-container-highest/20 px-2 py-0.5 rounded">
                    {settings.height}p @ {Math.round(settings.frameRate)}fps
                  </span>
                  <button
                    type="button"
                    title="Reload camera"
                    className="hover:bg-inverse-surface p-1 rounded transition-colors"
                    onClick={() => loadCamera(settings.deviceId)}
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 mt-space-lg">
              <label className="font-label-md text-label-md text-on-surface-variant flex items-center justify-between">
                <span>Active Camera</span>
                {cameraOk && <span className="text-tertiary font-medium">Ready</span>}
              </label>
              <div className="relative">
                <select
                  className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md rounded-lg py-2.5 pl-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
                  value={settings?.deviceId || ""}
                  onChange={(e) => loadCamera(e.target.value)}
                >
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-2.5 pointer-events-none text-on-surface-variant text-base">expand_more</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md">
              <div className={"flex items-center justify-center w-10 h-10 rounded-lg shrink-0 " + (cameraOk ? "bg-tertiary-fixed text-tertiary" : "bg-error-container text-error")}>
                <span className="material-symbols-outlined text-xl">videocam</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface">{cameraOk ? "Camera Verified" : "Camera Not Ready"}</span>
                  {cameraOk && <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  {cameraOk ? "Your camera is working" : "Allow camera access to continue"}
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-start gap-space-md">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container text-primary shrink-0">
                <span className="material-symbols-outlined text-xl">fullscreen</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Fullscreen Mode</span>
                  <span className="font-label-md text-label-md text-primary font-medium">Ready</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Starts when you begin the interview</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: rules + begin */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg">
            <div className="flex items-center gap-space-sm mb-space-lg">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-error-container text-error">
                <span className="material-symbols-outlined text-xl">shield</span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Interview Rules</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Monitored during the interview</p>
              </div>
            </div>

            <div className="space-y-space-md">
              {RULES.map((r) => (
                <div key={r.title} className="flex items-start gap-space-sm p-space-sm rounded-lg hover:bg-surface-container-low transition-colors">
                  <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-sm">{r.icon}</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface font-semibold">{r.title}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{r.text}</p>
                  </div>
                </div>
              ))}

              <div className="bg-surface-container-low rounded-xl p-space-md mt-space-sm">
                <div className="flex items-center gap-space-xs text-error mb-1">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <span className="font-label-lg text-label-lg font-semibold">3-Strike Rule</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  You get <strong>2 warnings</strong>. The <strong>3rd violation</strong> ends the interview.
                </p>
              </div>
            </div>

            <div className="mt-space-lg pt-space-md">
              <label className="flex items-start gap-space-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded cursor-pointer accent-primary"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  I have read and accept the interview rules and proctoring.
                </span>
              </label>
            </div>

            <div className="mt-space-lg flex flex-col gap-space-sm">
              <button
                type="button"
                className="w-full h-12 bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary text-on-primary rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md hover:shadow-lg transition-all duration-200"
                disabled={!accepted || !cameraOk || starting}
                onClick={handleBegin}
              >
                <span>{starting ? "Entering..." : "I Understand, Begin Interview"}</span>
                {!starting && <span className="material-symbols-outlined text-base">arrow_forward</span>}
              </button>
              {status && <p className="font-body-sm text-body-sm text-error">{status}</p>}
            </div>
          </div>

          <p className="font-code-sm text-code-sm text-on-surface-variant px-space-sm">Session ID: #{interviewId}</p>
        </div>
      </div>
    </div>
  );
}