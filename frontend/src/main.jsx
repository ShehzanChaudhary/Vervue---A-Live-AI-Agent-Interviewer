import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// StrictMode jaan-boojhkar nahi: avatar connection do baar start ho jaata
createRoot(document.getElementById("root")).render(<App />);
