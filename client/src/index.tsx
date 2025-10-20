import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./utils/autoLogin"; // Load test helpers
import { ThemeProvider } from "./contexts/ThemeContext";
import "./config/chartSetup"; // Initialize Chart.js globally

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
