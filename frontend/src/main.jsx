import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import HrDashboard from "./HrDashboard.jsx";
import HrLogin from "./HrLogin.jsx";
import CandidateEvaluation from "./CandidateEvaluation.jsx";
import { getToken } from "./auth.js";
import "./styles.css";

function RequireHr({ children }) {
  return getToken() ? children : <Navigate to="/hr/login" replace />;
}

// StrictMode jaan-boojhkar nahi: avatar connection do baar start ho jaata
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/hr/login" element={<HrLogin />} />
      <Route path="/hr" element={<RequireHr><HrDashboard /></RequireHr>} />
      <Route path="/hr/candidates/:id" element={<RequireHr><CandidateEvaluation /></RequireHr>} />
      <Route path="/apply/:publicId" element={<App />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
);