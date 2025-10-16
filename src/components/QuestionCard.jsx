import React from "react";
import { motion } from "framer-motion";

export default function QuestionCard({ question, selected, onAnswer }) {
  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.995 }}
      transition={{ duration: 0.18 }}
      className="bg-gradient-to-b from-slate-800/80 to-slate-900/70 border border-white/5 rounded-2xl p-6 max-w-2xl mx-auto card-blur card-dark"
      role="region"
      aria-labelledby={`q-${question.id}`}
    >
      <div id={`q-${question.id}`} className="mb-3">
        <div className="text-sm text-amber-400 uppercase tracking-wide">{question.domainTitle}</div>
        <h3 className="text-xl font-semibold mt-1">{question.text}</h3>
        {question.explain && <div className="text-sm text-slate-400 mt-2">{question.explain}</div>}
      </div>

      <div className="mt-4 grid gap-3">
        {(question.options || []).map((opt) => {
          const isSelected = selected === opt.value || selected === String(opt.value);
          return (
            <motion.button
              key={opt.value}
              onClick={() => onAnswer(question.id, opt.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
              className={`flex items-center justify-between p-3 rounded-xl border ${isSelected ? "bg-indigo-600/90 border-indigo-500 shadow-lg" : "bg-white/2 border-white/6 hover:bg-white/5"} focus:outline-none focus:ring-2 focus:ring-indigo-400 btn-animated`}
              aria-pressed={isSelected}
            >
              <div className="text-left">
                <div className={`font-medium ${isSelected ? "text-white" : "text-slate-100"}`}>{opt.label}</div>
                {opt.desc && <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>}
              </div>

              <div className="ml-4 flex items-center">
                {isSelected ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/20" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}