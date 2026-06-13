import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./globals.css";
import { WebApp } from "./WebApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WebApp />
  </StrictMode>,
);
