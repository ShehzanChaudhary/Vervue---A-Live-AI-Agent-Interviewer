import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import HrDashboard from "./HrDashboard.jsx";
import CandidateEvaluation from "./CandidateEvaluation.jsx";
import "./styles.css";

// StrictMode jaan-boojhkar nahi: avatar connection do baar start ho jaata
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/hr" element={<HrDashboard />} />
      <Route path="/hr/candidates/:id" element={<CandidateEvaluation />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
);