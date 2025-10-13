import React, { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import ScanPage from "./pages/ScanPage";
import ResultPage from "./pages/ResultPage";

const STORAGE_KEY = "ai-scan-session-v1";

export default function App() {
  const [page, setPage] = useState("landing"); 
  const [session, setSession] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSession(JSON.parse(raw));
        const parsed = JSON.parse(raw);
        if (parsed && parsed.started) setPage("scan");
      }
    } catch (err) {
      console.warn("Could not parse saved session", err);
    }
  }, []);

  function startNewSession() {
    const newSession = {
      started: true,
      startedAt: new Date().toISOString(),
      answers: {}, 
      currentIndex: 0,
      meta: {},
    };
    setSession(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setPage("scan");
  }

  function updateSession(patch) {
    const updated = { ...(session || {}), ...patch };
    setSession(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
  }

  function clearSession() {
    setSession(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setPage("landing");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {page === "landing" && (
        <LandingPage onStart={startNewSession} resume={() => setPage("scan")} hasSaved={!!session} clearSaved={clearSession} />
      )}
      {page === "scan" && (
        <ScanPage
          session={session}
          save={updateSession}
          finish={(results) => {
            updateSession({ finishedAt: new Date().toISOString(), results });
            setPage("results");
          }}
          abort={() => {
            setPage("landing");
          }}
        />
      )}
      {page === "results" && <ResultPage session={session} restart={() => { clearSession(); startNewSession(); }} backToLanding={() => { setPage("landing"); }} />}
    </div>
  );
}