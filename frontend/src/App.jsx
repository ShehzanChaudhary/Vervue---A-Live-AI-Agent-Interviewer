import { useEffect, useRef, useState } from "react";
import { createClient, AnamEvent } from "@anam-ai/js-sdk";
import Landing from "./Landing.jsx";
import StartForm from "./StartForm.jsx";
import Interview from "./Interview.jsx";
import { useProctoring } from "./useProctoring.js";
import ProctorBanner from "./ProctorBanner.jsx";
import CheckScreen from "./CheckScreen.jsx";
import AppHeader from "./AppHeader.jsx";

const BRAND = "Interview Prep"; // yahan apna product name daal do

async function errorText(res) {
  const body = await res.json().catch(() => null);
  const detail = body && body.detail;
  if (!detail) return res.statusText;
  return typeof detail === "string" ? detail : JSON.stringify(detail);
}

export default function App() {
  const [view, setView] = useState("landing"); // landing | form | interview
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState([]);
  const [progress, setProgress] = useState({ n: 1, max: 6 });
  const [report, setReport] = useState(null);
  const [ended, setEnded] = useState(false);
  const [problem, setProblem] = useState(null); 
  const [warning, setWarning] = useState(null);

  // Original code ke variables, ab refs me (re-render ki zarurat nahi)
  const anam = useRef(null);
  const interviewId = useRef(null);
  const firstQuestion = useRef("");
  const lastUserMessageId = useRef(null);
  const busy = useRef(false);
  const finished = useRef(false);
  const coding = useRef(false);
  const spokenNotes = useRef([]);
  const lastQuestion = useRef("");

  const addLine = (who, text) => setLines((l) => [...l, { who, text }]);

  const proctor = useProctoring({
    active: view === "interview" && !ended && !report,
    onWarning: (item) => reportViolation(item, false),
    onLimit: (item) => reportViolation(item, true),
  });

  async function reportViolation(item, isLimit) {
    try {
      const res = await fetch(`/interviews/${interviewId.current}/violations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type }),
      });
      if (!res.ok) throw new Error(await errorText(res));
      const data = await res.json();

      if (data.status === "ended_by_proctoring") {
        endByProctoring();
      } else {
        setWarning({
          type: item.type,
          count: data.violation_count,
          warningsLeft: data.warnings_left,
        });
      }
    } catch (err) {
      // Server tak baat nahi pahunchi, par limit hit ho chuki hai to interview phir bhi end hoga
      if (isLimit) endByProctoring();
      else setStatus("Error: " + err.message);
    }
  }

  function endByProctoring() {
    finished.current = true;
    coding.current = false;
    setProblem(null);
    setWarning(null);
    proctor.stop();
    anam.current?.stopStreaming();
    setConnected(false);
    setEnded(true);
    setStatus("Interview ended because the interview rules were broken 3 times.");
  }

  async function dismissWarning() {
    const type = warning.type;
    setWarning(null);
    if (type === "camera_off") {
      await proctor.start();
    } else if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  async function beginInterview() {
  setStatus("");
  const result = await proctor.enterFullscreen();
  if (!result.ok) {
    setStatus("Fullscreen is required: " + result.error);
    return;
  }
  setView("interview");
}

  async function speak(text) {
    addLine("Interviewer", text);
    await anam.current.talk(text);
  }

  async function repeatQuestion() {
  if (busy.current || finished.current || !lastQuestion.current) return;
  await speak(lastQuestion.current);
  }

    function applyQuestion(q) {
    lastQuestion.current = q.question; 
    const isCoding = q.question_type === "coding";
    coding.current = isCoding;
    spokenNotes.current = [];
    setProblem(isCoding ? q.problem_statement : null);
  }

  async function sendAnswer(answer, shownText) {
    if (busy.current || finished.current) return;
    busy.current = true;
    addLine("You", shownText);
    setStatus("Evaluating your answer...");

    try {
      const res = await fetch(`/interviews/${interviewId.current}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) throw new Error(await errorText(res));
      const data = await res.json();

      if (data.status === "completed") {
        finished.current = true;
        coding.current = false;
        setProblem(null);
        setReport(data.report);
        proctor.stop();
        setStatus("Interview complete.");
        await speak("That was the last question. Thank you for your time. Your interview is complete.");
      } else {
        applyQuestion(data.next_question);
        setProgress({ n: data.question_number, max: data.max_questions });
        setStatus(
          data.next_question.question_type === "coding"
            ? `Question ${data.question_number} of ${data.max_questions}. Write your code in the notepad, explain your approach aloud, then press Submit.`
            : `Question ${data.question_number} of ${data.max_questions}. Your turn.`
        );
        await speak(data.next_question.question);
      }
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      busy.current = false;
    }
  }

  async function onMessagesUpdated(messages) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || lastUser.id === lastUserMessageId.current) return;
    lastUserMessageId.current = lastUser.id;

    if (busy.current || finished.current) return;

    if (coding.current) {
      // Coding question pe bola hua text submit nahi hota, bas jama hota hai
      spokenNotes.current.push(lastUser.content);
      addLine("You", lastUser.content);
      return;
    }
    await sendAnswer(lastUser.content, lastUser.content);
  }

  async function submitCode(code) {
    const notes = spokenNotes.current.join(" ");
    const answer = notes ? `Code:\n${code}\n\nExplanation: ${notes}` : `Code:\n${code}`;
    await sendAnswer(answer, "Submitted my code from the notepad.");
  }

  async function startAvatar() {
    setStatus("Connecting to your interviewer...");
    try {
      const res = await fetch("/anam/session-token", { method: "POST" });
      if (!res.ok) throw new Error(await errorText(res));
      const { sessionToken } = await res.json();

      anam.current = createClient(sessionToken);
      anam.current.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
        setConnected(true);
        setStatus("Connected. Your interviewer is asking the first question...");
        speak(firstQuestion.current);
      });
      anam.current.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, onMessagesUpdated);
      await anam.current.streamToVideoElement("avatar");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  // <video id="avatar"> render hone ke baad hi stream start karna hai
  useEffect(() => {
    if (view === "interview") startAvatar();
  }, [view]);

  async function handleStart(formData) {
    setStatus("Analyzing your resume and the job description...");
    const res = await fetch("/interviews", { method: "POST", body: formData });
    if (!res.ok) throw new Error(await errorText(res));
    const data = await res.json();

    interviewId.current = data.interview_id;
    firstQuestion.current = data.question.question;
    lastQuestion.current = data.question.question;
    setProgress({ n: 1, max: Number(formData.get("max_questions")) || 6 });
    setView("check");
    setStatus("");
  }

  function endSession() {
    proctor.stop();
    anam.current?.stopStreaming();
    setConnected(false);
    setEnded(true);
    setStatus("Session ended.");
  }

  return (
  <>
    <AppHeader view={view} onStart={() => setView("form")} />
    <main className={view === "interview" || view === "landing" ? "" : "page " + view}>
      {view === "landing" && <Landing onStart={() => setView("form")} />}
      {view === "form" && <StartForm onSubmit={handleStart} status={status} />}
      {view === "check" && (
        <CheckScreen
          proctor={proctor}
          interviewId={interviewId.current}
          status={status}
          onBegin={beginInterview}
        />
      )}
      {view === "interview" && (
        <Interview
          status={status}
          connected={connected}
          progress={progress}
          lines={lines}
          report={report}
          ended={ended}
          onEnd={endSession}
          onRepeat={repeatQuestion}
          problem={problem}
          onSubmitCode={submitCode}
          proctor={proctor}
        />
      )}
    </main>
    <ProctorBanner warning={warning} onDismiss={dismissWarning} />
  </>
);
}
