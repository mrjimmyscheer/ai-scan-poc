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
      className="bg-slate-800/70 border border-white/5 rounded-2xl p-6 max-w-2xl mx-auto card-blur"
      role="region"
      aria-labelledby={`q-${question.id}`}
    >
      <div className="mb-4">
        <h3 id={`q-${question.id}`} className="text-lg font-semibold text-slate-100">
          {question.title}
        </h3>
        {question.text && (
          <p className="text-sm text-slate-400 mt-1">{question.text}</p>
        )}
      </div>

      <div className="grid gap-3">
        {question.options.map((opt, i) => {
          const isSelected = selected === opt.value;
          return (
            <motion.button
              key={`${question.id}-option-${i}`}
              onClick={() => onAnswer(question.id, opt.value)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              aria-pressed={isSelected}
              className={`text-left p-3 rounded-xl border transition flex items-center justify-between
                ${isSelected
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border-indigo-500"
                  : "bg-white/3 border-white/6 text-slate-100 hover:bg-white/6"}`}
            >
              <div>
                <div className="font-medium">{opt.label}</div>
                {opt.desc && <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>}
              </div>
              <div className="ml-4 text-sm text-slate-200">
                {isSelected ? "✓" : ""}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}