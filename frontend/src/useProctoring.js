import { useCallback, useEffect, useRef, useState } from "react";

const MAX_WARNINGS = 2; // 2 warning, teesri violation par interview end
const COOLDOWN_MS = 2000; // ek hi harkat se do events aaye to ek hi violation ginna

export function useProctoring({ active, onWarning, onLimit }) {
  const [stream, setStream] = useState(null);
  const [violations, setViolations] = useState([]);

  const countRef = useRef(0);
  const lastTimeRef = useRef(0);
  const endedRef = useRef(false);
  const streamRef = useRef(null);

  // callbacks aur active ko ref mein rakha, taaki listeners purane value pe na atke
  const callbacksRef = useRef({ onWarning, onLimit });
  callbacksRef.current = { onWarning, onLimit };
  const activeRef = useRef(active);
  activeRef.current = active;

  const report = useCallback((type) => {
    // interview shuru hone se pehle (check screen par) koi violation nahi ginna
    if (endedRef.current || !activeRef.current) return;

    const now = Date.now();
    if (now - lastTimeRef.current < COOLDOWN_MS) return;
    lastTimeRef.current = now;

    countRef.current += 1;
    const count = countRef.current;
    const item = { type, count, at: new Date().toISOString() };
    setViolations((prev) => [...prev, item]);

    if (count > MAX_WARNINGS) {
      endedRef.current = true;
      callbacksRef.current.onLimit(item);
    } else {
      callbacksRef.current.onWarning({ ...item, warningsLeft: MAX_WARNINGS - count });
    }
  }, []);

  // Camera chalu karna (check screen khulte hi, ya camera badalne par deviceId ke saath)
  const startCamera = useCallback(
    async (deviceId) => {
      endedRef.current = false;
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
        streamRef.current = mediaStream;
        setStream(mediaStream);

        mediaStream.getVideoTracks()[0].onended = () => report("camera_off");
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },
    [report]
  );

  // Ye button ke click handler se bulana hai (fullscreen ke liye user click zaroori hai)
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, []);

  // Purane App.jsx ke liye: camera + fullscreen ek saath
  const start = useCallback(async () => {
    const cam = await startCamera();
    if (!cam.ok) return cam;
    return enterFullscreen();
  }, [startCamera, enterFullscreen]);

  const stop = useCallback(() => {
    endedRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, []);

  // Jab tak interview active hai, tab tak browser events sunna
  useEffect(() => {
    if (!active) return;

    const onVisibility = () => {
      if (document.hidden) report("tab_switch");
    };
    const onBlur = () => report("tab_switch");
    const onFullscreen = () => {
      if (!document.fullscreenElement) report("fullscreen_exit");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [active, report]);

  return { stream, violations, start, startCamera, enterFullscreen, stop };
}