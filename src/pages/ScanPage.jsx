import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import QuestionCard from "../components/QuestionCard";
import surveyJson from "../survey_nl_cleaned.json";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY_PREFIX = "ai-scan-session-";

function flattenQuestions(domains) {
  const questions = [];
  (domains || []).forEach((d) => {
    (d.questions || []).forEach((q) => {
      questions.push({ ...q, domainId: d.id, domainTitle: d.title });
    });
  });
  return questions;
}

export default function ScanPage() {
  const domains = surveyJson.domains || [];
  const questions = flattenQuestions(domains);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const mounted = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedSessions = Object.keys(localStorage).filter((k) =>
      k.startsWith(STORAGE_KEY_PREFIX)
    );
    if (savedSessions.length) {
      const latest = savedSessions.sort().pop();
      try {
        const data = JSON.parse(localStorage.getItem(latest));
        if (data && data.answers) {
          setAnswers(data.answers || {});
          setSessionId(latest.replace(STORAGE_KEY_PREFIX, ""));
        } else {
          const id = `s_${Date.now()}`;
          setSessionId(id);
          localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify({ created: Date.now(), answers: {} }));
        }
      } catch (err) {
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
    if (!mounted.current) return;
    if (!sessionId) return;
    localStorage.setItem(STORAGE_KEY_PREFIX + sessionId, JSON.stringify({ created: Date.now(), answers }));
  }, [answers, sessionId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  function onAnswer(qid, value) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    setTimeout(() => {
      if (index < questions.length - 1) setIndex((s) => s + 1);
      else finishAndShowResults();
    }, 160);
  }

  function discardSession() {
    if (!sessionId) return;
    if (!confirm("Weet je zeker dat je deze sessie wilt verwijderen? Dit kan niet ongedaan gemaakt worden.")) return;
    localStorage.removeItem(STORAGE_KEY_PREFIX + sessionId);
    const id = `s_${Date.now()}`;
    setSessionId(id);
    setAnswers({});
    localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify({ created: Date.now(), answers: {} }));
  }

  function resumeDifferent() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_KEY_PREFIX));
    const list = keys.map(k => k.replace(STORAGE_KEY_PREFIX, "")).join("\n");
    const pick = prompt("Plak de sessie key die je wilt laden:\n" + list);
    if (!pick) return;
    const key = STORAGE_KEY_PREFIX + pick;
    const stored = localStorage.getItem(key);
    if (!stored) { alert("Geen sessie gevonden."); return; }
    const data = JSON.parse(stored);
    setSessionId(pick);
    setAnswers(data.answers || {});
    const allQs = questions.map(q => q.id);
    const firstUnanswered = allQs.findIndex(id => !(data.answers || {})[id]);
    setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
  }

  function finishAndShowResults() {
    navigate("/results", { state: { domains, answers } });
  }

  const progress = questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0;
  const currentQuestion = questions[index];

  return (
    <div className="min-h-screen py-8 px-4 bg-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI-scan</h1>
            <div className="text-sm text-slate-400">Sessie: {sessionId}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={resumeDifferent} className="px-3 py-2 border rounded bg-white/3 text-slate-100">Laad sessie</button>
            <button onClick={discardSession} className="px-3 py-2 bg-red-600 text-white rounded">Verwijder sessie</button>
          </div>
        </div>

        <div className="mb-4">
          <div className="h-2 w-full bg-white/6 rounded-full overflow-hidden">
            <div className="h-full progress-fill" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
          </div>
          <div className="text-xs text-slate-400 mt-2">{index + 1} / {questions.length}</div>
        </div>

        <main className="py-6">
          <AnimatePresence mode="wait">
            <div key={currentQuestion ? currentQuestion.id : "done"}>
              {currentQuestion ? (
                <QuestionCard
                  question={currentQuestion}
                  selected={answers[currentQuestion.id]}
                  onAnswer={onAnswer}
                />
              ) : (
                <div className="text-center p-6 bg-white/4 rounded">Geen vragen gevonden.</div>
              )}
            </div>
          </AnimatePresence>
        </main>

        <footer className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="px-4 py-2 rounded-lg bg-white/4 hover:bg-white/6"
            disabled={index === 0}
          >
            Terug
          </button>

          <div className="text-sm text-slate-400">Tip: kies het antwoord dat het meest van toepassing is.</div>

          <div className="flex gap-2">
            <button
              onClick={finishAndShowResults}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md text-white"
            >
              Klaar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}