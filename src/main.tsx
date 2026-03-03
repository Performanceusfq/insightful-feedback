import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/lib/supabase";

if (import.meta.env.DEV) {
  void supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error("[Supabase smoke test] getSession error:", error.message);
        return;
      }

      console.info("[Supabase smoke test] getSession ok", {
        hasSession: Boolean(data.session),
      });
    })
    .catch((error: unknown) => {
      console.error("[Supabase smoke test] unexpected error:", error);
    });
}

createRoot(document.getElementById("root")!).render(<App />);
