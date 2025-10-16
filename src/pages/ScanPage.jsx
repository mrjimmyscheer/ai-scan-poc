import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QuestionCard from "../components/QuestionCard";
import surveyJson from "../survey_nl_cleaned.json";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY_PREFIX = "ai-scan-session-";

function Toast({ message, show, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-white/20"
        >
          <span className="font-medium">{message}</span>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Modal({ show, title, children, onClose, actions }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-md flex flex-col"
          >
            <h2 className="text-xl font-semibold text-indigo-400 mb-4">{title}</h2>

            <div className="flex-1 text-slate-200 mb-6 space-y-4">
              {children}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition shadow hover:shadow-lg"
              >
                Sluiten
              </button>
              {actions && actions.map((act, i) => (
                <button
                  key={i}
                  onClick={act.onClick}
                  className={`px-5 py-2 rounded-xl font-medium transition shadow hover:shadow-lg ${
                    act.variant === "primary"
                      ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                      : act.variant === "danger"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-600 hover:bg-gray-500 text-white"
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ScanPage() {
  const domains = surveyJson.domains || [];
  const questions = domains.flatMap(d => (d.questions || []).map(q => ({ ...q, domainId: d.id, domainTitle: d.title })));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  // Modals
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const mounted = useRef(false);
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  useEffect(() => {
    const savedSessions = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY_PREFIX));
    if (savedSessions.length) {
      const latest = savedSessions.sort().pop();
      try {
        const data = JSON.parse(localStorage.getItem(latest));
        setAnswers(data?.answers || {});
        setSessionId(latest.replace(STORAGE_KEY_PREFIX, ""));
      } catch {
        const id = `s_${Date.now()}`;
        setSessionId(id);
        localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify({ created: Date.now(), answers: {} }));
      }
    } else {
      const id = `s_${Date.now()}`;
      setSessionId(id);
      localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify({ created: Date.now(), answers: {} }));
    }

    mounted.current = true;

    const onBefore = (e) => {
      if (Object.keys(answers || {}).length > 0) {
        e.preventDefault();
        e.returnValue = "Je hebt onafgemaakte antwoorden — weet je zeker dat je wilt verlaten?";
      }
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, []);

  useEffect(() => {
    if (!mounted.current || !sessionId) return;
    localStorage.setItem(STORAGE_KEY_PREFIX + sessionId, JSON.stringify({ created: Date.now(), answers }));
  }, [answers, sessionId]);

  function onAnswer(qid, value) {
    setAnswers(prev => ({ ...prev, [qid]: value }));
    setTimeout(() => {
      if (index < questions.length - 1) setIndex(i => i + 1);
      else finishAndShowResults();
    }, 160);
  }

  function discardSession() {
    setShowConfirmDelete(true);
  }

  function confirmDeleteSession() {
    if (!sessionId) return;
    localStorage.removeItem(STORAGE_KEY_PREFIX + sessionId);
    const id = `s_${Date.now()}`;
    setSessionId(id);
    setAnswers({});
    localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify({ created: Date.now(), answers: {} }));
    setShowConfirmDelete(false);
    showToast("Sessie verwijderd en nieuwe sessie gestart.");
  }

  function resumeDifferent() {
    setShowKeyInput(true);
  }

  function handleResume() {
    const key = STORAGE_KEY_PREFIX + keyInput.trim();
    const stored = localStorage.getItem(key);
    if (!stored) {
      showToast("Geen sessie gevonden.");
      return;
    }
    const data = JSON.parse(stored);
    setSessionId(keyInput);
    setAnswers(data.answers || {});
    const allQs = questions.map(q => q.id);
    const firstUnanswered = allQs.findIndex(id => !(data.answers || {})[id]);
    setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
    setShowKeyInput(false);
    showToast("Sessie geladen.");
  }

  function finishAndShowResults() {
    navigate("/results", { state: { domains, answers } });
  }

  const progress = questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0;
  const currentQuestion = questions[index];

  return (
    <div className="min-h-screen py-8 px-4 bg-slate-900 text-slate-100 relative">

      {/* Toast */}
      <Toast message={toast.message} show={toast.show} onClose={() => setToast({ show: false, message: "" })} />

      {/* Key input modal */}
      <Modal
        show={showKeyInput}
        title="Laad een bestaande sessie"
        onClose={() => setShowKeyInput(false)}
        actions={[
          { label: "Annuleer", onClick: () => setShowKeyInput(false), variant: "secondary" },
          { label: "Laad sessie", onClick: handleResume, variant: "primary" }
        ]}
      >
        {/* Input voor key */}
        <input
          type="text"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="Sessie key"
          className="w-full px-4 py-2 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {/* Opslag keys lijst */}
        <div className="mt-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
          {Object.keys(localStorage)
            .filter(k => k.startsWith(STORAGE_KEY_PREFIX))
            .sort()
            .reverse()
            .map((key) => {
              const shortKey = key.replace(STORAGE_KEY_PREFIX, "");
              const isActive = shortKey === sessionId;
              return (
                <div
                  key={key}
                  className={`flex justify-between items-center px-3 py-2 rounded-xl text-slate-200 transition cursor-pointer ${
                    isActive ? "bg-indigo-600/40" : "bg-slate-800/70 hover:bg-slate-700"
                  }`}
                >
                  <span className="truncate">{shortKey}{isActive && " (actief)"}</span>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-medium transition"
                      onClick={() => {
                        navigator.clipboard.writeText(shortKey);
                        showToast("Key gekopieerd!");
                      }}
                    >
                      Kopieer
                    </button>
                    <button
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition"
                      onClick={() => {
                        localStorage.removeItem(key);
                        if (isActive) setSessionId(null);
                        showToast("Sessie verwijderd!");
                        setKeyInput(""); // reset input if deleted
                      }}
                    >
                      Verwijder
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>

      <Modal
        show={showConfirmDelete}
        title="Weet je het zeker?"
        onClose={() => setShowConfirmDelete(false)}
        actions={[
          { label: "Annuleer", onClick: () => setShowConfirmDelete(false), variant: "secondary" },
          { label: "Verwijder", onClick: confirmDeleteSession, variant: "danger" }
        ]}
      >
        <p className="text-slate-300">
          Deze sessie wordt verwijderd en kan niet ongedaan gemaakt worden.
        </p>
      </Modal>

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-400">AI-scan</h1>
            <div className="text-sm text-slate-400 mt-1">Sessie: {sessionId}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow">Home</button>
            <button onClick={resumeDifferent} className="px-4 py-2 border border-indigo-400 text-indigo-200 rounded-lg hover:bg-indigo-500/20">Laad sessie</button>
            <button onClick={discardSession} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow">Verwijder sessie</button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
          </div>
          <div className="text-xs text-slate-400 mt-1">{index + 1} / {questions.length}</div>
        </div>

        {/* Question */}
        <main className="py-6">
          <AnimatePresence mode="wait">
            <div key={currentQuestion ? currentQuestion.id : "done"}>
              {currentQuestion ? (
                <QuestionCard question={currentQuestion} selected={answers[currentQuestion.id]} onAnswer={onAnswer} />
              ) : (
                <div className="text-center p-6 bg-white/5 rounded-lg text-slate-200 font-medium">Geen vragen gevonden.</div>
              )}
            </div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="mt-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex gap-2">
            <button onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0} className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow">Terug</button>
          </div>
          <div className="text-sm text-slate-400 text-center md:text-left">Tip: kies het antwoord dat het meest van toepassing is.</div>
          <div className="flex gap-2">
            <button onClick={finishAndShowResults} className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md text-white font-semibold hover:scale-105 transition-transform">Klaar</button>
          </div>
        </footer>

      </div>
    </div>
  );
}