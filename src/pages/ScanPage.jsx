import React, { useEffect, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import { motion } from "framer-motion";
import { computeDomainScores } from "../utils/scoring";

export default function ScanPage({ session, save, finish, abort }) {
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState(session?.answers || {});
  const [index, setIndex] = useState(session?.currentIndex || 0);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetch("../survey.json")
      .then((r) => r.json())
      .then((data) => {
        setSurvey(data);
        const allQs = data.domains.flatMap((d) =>
          d.questions.map((q) => ({ ...q, domainId: d.id }))
        );
        setQuestions(allQs);
      });
  }, []);

  useEffect(() => {
    save({ answers, currentIndex: index, started: true });
  }, [answers, index]);

  if (!survey || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Laden van vragen...</p>
      </div>
    );
  }

  const currentQuestion = questions[index];
  const progressPct = Math.round((index / questions.length) * 100);

  function onAnswer(qId, key) {
    const next = { ...answers, [qId]: key };
    setAnswers(next);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      const results = computeDomainScores(survey.domains, next);
      finish(results);
    }
  }

  function goBack() {
    setIndex(Math.max(0, index - 1));
  }

  function jumpTo(i) {
    if (i >= 0 && i < questions.length) setIndex(i);
  }

  function discardAndRestart() {
    setAnswers({});
    setIndex(0);
    save({ answers: {}, currentIndex: 0, started: true });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12">
      <div className="w-full max-w-3xl px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">AI Maturity Scan</h2>
          <div className="text-sm text-slate-400">
            Vraag {index + 1} van {questions.length}
          </div>
        </div>

        <div className="h-2 bg-white/6 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400"
            style={{ width: `${progressPct}%`, transition: "width 300ms" }}
          />
        </div>

        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <QuestionCard
            question={currentQuestion}
            selected={answers[currentQuestion.id]}
            onAnswer={(k) => onAnswer(currentQuestion.id, k)}
          />
        </motion.div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={goBack}
              disabled={index === 0}
              className="px-4 py-2 rounded-lg bg-white/5 text-sm disabled:opacity-50"
            >
              Terug
            </button>
            <button
              onClick={() => jumpTo(0)}
              className="px-4 py-2 rounded-lg bg-white/5 text-sm"
            >
              Begin
            </button>
            <button
              onClick={discardAndRestart}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm"
            >
              Verwijder antwoorden
            </button>
          </div>

          <div className="text-sm text-slate-400">
            Auto-saved in je browser
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button onClick={abort} className="text-sm text-slate-300 underline">
            Terug naar start
          </button>
        </div>
      </div>
    </div>
  );
}