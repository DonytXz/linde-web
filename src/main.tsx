import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

const isHashRouter = import.meta.env.VITE_ROUTER_MODE === "hash";
const Router = isHashRouter ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router basename={isHashRouter ? undefined : import.meta.env.BASE_URL}>
      <App />
    </Router>
  </StrictMode>,
);
