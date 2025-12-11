import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QuestionCard from "../components/QuestionCard";
import surveyJson from "../survey_nl_cleaned.json";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { Menu } from "lucide-react";

const STORAGE_KEY_PREFIX = "ai-scan-session-";

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
          { label: "Laad sessie", onClick: handleResume, variant: "primary" }
        ]}
      >
        <Input
          type="text"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          placeholder="Sessie key"
          className="w-full"
        />
      </Modal>

      <Modal
        show={showConfirmDelete}
        title="Weet je het zeker?"
        onClose={() => setShowConfirmDelete(false)}
        actions={[
          { label: "Verwijder", onClick: confirmDeleteSession, variant: "danger" }
        ]}
      >
        <p>Deze sessie wordt verwijderd en kan niet ongedaan gemaakt worden. </p> 
      </Modal>

  {/* Header */}
  <div className="max-w-4xl w-full mb-6 flex items-center justify-between px-2">
    {/* Title */}
    <h1 className="text-3xl font-extrabold text-primary">AI Scan</h1>

    {/* Desktop buttons */}
    <div className="hidden sm:flex gap-2">
      <Button
        onClick={() => navigate("/")}
      >
        Home
      </Button>
      <Button
        onClick={resumeDifferent}
        variant="outline"
      >
        Laad sessie
      </Button>
      <Button
        onClick={discardSession}
        variant="destructive"
      >
        Verwijder sessie
      </Button>
    </div>

    {/* Mobile dropdown */}
    <div className="sm:hidden relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowDropdown(prev => !prev)}
      >
        <Menu />
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-44 bg-card/90 backdrop-blur-md border rounded-xl shadow-lg flex flex-col z-50">
          <Button
            onClick={() => { navigate("/"); setShowDropdown(false); }}
            variant="ghost"
            className="justify-start"
          >
            Home
          </Button>
          <Button
            onClick={() => { resumeDifferent(); setShowDropdown(false); }}
            variant="ghost"
            className="justify-start"
          >
            Laad sessie
          </Button>
          <Button
            onClick={() => { discardSession(); setShowDropdown(false); }}
            variant="ghost"
            className="justify-start text-destructive"
          >
            Verwijder sessie
          </Button>
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
      <Button
        onClick={() => setIndex(i => Math.max(0, i - 1))}
        disabled={index === 0}
        className="w-full"
        variant="outline"
      >
        Terug
      </Button>
    </div>

    {/* Tip */} 
    <div className="text-sm text-indigo-200 text-center flex-1 px-2"> {/* <-- kunnen we altijd verwijderen */}
      Tip: kies het antwoord dat het meest van toepassing is.
    </div>

    {/* Right button */}
    <div className="min-w-[120px]">
      <Button
        onClick={finishAndShowResults}
        className="w-full"
      >
        Klaar
      </Button>
    </div>
  </footer>
</div>
);
}