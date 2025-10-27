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
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4"
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
            <div className="flex-1 text-slate-200 mb-6 space-y-4">{children}</div>
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
  const questions = domains.flatMap(d =>
    (d.questions || []).map(q => ({ ...q, domainId: d.id, domainTitle: d.title }))
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);

  const mounted = useRef(false);
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // session maken of laden
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
    <div className="min-h-screen py-6 px-4 bg-gradient-to-b from-[#4b0e5e] via-[#61177c] to-[#8b3da6] text-white flex flex-col items-center">
      {/* Toast */}
      <Toast message={toast.message} show={toast.show} onClose={() => setToast({ show: false, message: "" })} />

      {/* Modals */}
      <Modal
        show={showKeyInput}
        title="Laad een bestaande sessie"
        onClose={() => setShowKeyInput(false)}
        actions={[
          { label: "Annuleer", onClick: () => setShowKeyInput(false), variant: "secondary" },
          { label: "Laad sessie", onClick: handleResume, variant: "primary" }
        ]}
      >
        <input
          type="text"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="Sessie key"
          className="w-full px-4 py-2 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
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
        <p className="text-slate -300">Deze sessie wordt verwijderd en kan niet ongedaan gemaakt worden. </p> 
      </Modal>

  {/* Header */}
  <div className="max-w-4xl w-full mb-6 flex items-center justify-between px-2">
    {/* Title */}
    <h1 className="text-3xl font-extrabold text-indigo-300">AI Scan</h1>

    {/* Desktop buttons */}
    <div className="hidden sm:flex gap-2">
      <button
        onClick={() => navigate("/")}
        className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#61177c] via-[#7c2ca5] to-[#9b4ddb] text-white font-medium shadow-lg hover:brightness-110 transition-all"
      >
        Home
      </button>
      <button
        onClick={resumeDifferent}
        className="px-4 py-2 rounded-2xl border border-[#b49be1] text-[#e0d7ff] hover:bg-[#7c2ca5]/20 transition-all"
      >
        Laad sessie
      </button>
      <button
        onClick={discardSession}
        className="px-5 py-2 rounded-3xl bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 font-semibold"
      >
        Verwijder sessie
      </button>
    </div>

    {/* Mobile dropdown */}
    <div className="sm:hidden relative">
      <button
        className="px-4 py-2 bg-[#61177c] rounded-2xl text-white font-medium shadow-lg hover:brightness-110 transition-all"
        onClick={() => setShowDropdown(prev => !prev)}
      >
        Menu ▼
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-44 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl shadow-lg flex flex-col z-50">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-left hover:bg-indigo-600/50 transition-colors"
          >
            Home
          </button>
          <button
            onClick={resumeDifferent}
            className="px-4 py-2 text-left hover:bg-indigo-600/50 transition-colors"
          >
            Laad sessie
          </button>
          <button
            onClick={discardSession}
            className="px-4 py-2 text-left text-red-400 hover:bg-red-600/30 transition-colors"
          >
            Verwijder sessie
          </button>
        </div>
      )}
    </div>
  </div>

  {/* Progress */}
  <div className="max-w-2xl w-full mb-6 px-2">
    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
      <div className="h-full transition-all duration-300 rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #61177c, #7c2ca5, #9b4ddb)" }} />
    </div>
    <div className="text-xs text-indigo-200 mt-1 text-right">{index + 1} / {questions.length}</div>
  </div>

  {/* Question */}
  <main className="flex-1 w-full max-w-2xl flex flex-col items-center">
    <AnimatePresence mode="wait">
      {currentQuestion ? (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <QuestionCard question={currentQuestion} selected={answers[currentQuestion.id]} onAnswer={onAnswer} />
        </motion.div>
      ) : (
        <motion.div
          key="done"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center p-6 text-purple-200 font-medium"
        >
          Geen vragen gevonden.
        </motion.div>
      )}
    </AnimatePresence>
  </main>

  {/* Footer */}
  <footer className="mt-8 flex flex-row items-center justify-between max-w-2xl w-full gap-4">
    {/* Left button */}
    <div className="min-w-[120px]">
      <button
        onClick={() => setIndex(i => Math.max(0, i - 1))}
        disabled={index === 0}
        className="px-6 py-2 rounded-2xl bg-gradient-to-r from-[#61177c] via-[#7c2ca5] to-[#9b4ddb] shadow-lg text-white font-semibold hover:scale-105 transition-transform text-sm sm:text-base max-w-xs w-full"
      >
        Terug
      </button>
    </div>

    {/* Tip */} 
    <div className="text-sm text-indigo-200 text-center flex-1 px-2"> {/* <-- kunnen we altijd verwijderen */}
      Tip: kies het antwoord dat het meest van toepassing is.
    </div>

    {/* Right button */}
    <div className="min-w-[120px]">
      <button
        onClick={finishAndShowResults}
        className="px-6 py-2 rounded-2xl bg-gradient-to-r from-[#61177c] via-[#7c2ca5] to-[#9b4ddb] shadow-lg text-white font-semibold hover:scale-105 transition-transform text-sm sm:text-base max-w-xs w-full"
      >
        Klaar
      </button>
    </div>
  </footer>
</div>
);
}