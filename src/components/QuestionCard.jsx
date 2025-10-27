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
      className="w-full flex flex-col gap-6 bg-gradient-to-b from-[#4b0e5e]/70 via-[#61177c]/50 to-[#7c2ca5]/30 rounded-3xl p-6 backdrop-blur-md shadow-lg"
      role="region"
      aria-labelledby={`q-${question.id}`}
    >
      {/* Question text */}
      <div id={`q-${question.id}`} className="flex flex-col gap-2">
        <div className="text-sm text-purple-300 uppercase tracking-wide">{question.domainTitle}</div>
        <h3 className="text-2xl md:text-3xl font-bold text-white">{question.text}</h3>
        {question.explain && <div className="text-sm text-purple-200/80">{question.explain}</div>}
      </div>

      {/* Options */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(question.options || []).map((opt) => {
          const isSelected = selected === opt.value || selected === String(opt.value);
          return (
            <motion.button
              key={opt.value}
              onClick={() => onAnswer(question.id, opt.value)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className={`flex items-center justify-between p-4 rounded-xl border border-transparent font-medium text-left shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400
                ${isSelected
                  ? "bg-indigo-500 text-white shadow-2xl ring-2 ring-indigo-400"
                  : "bg-white/5 text-purple-100 hover:bg-white/10"
                }`}
              aria-pressed={isSelected}
            >
              <div className="flex-1">
                <div className={`${isSelected ? "text-white" : "text-purple-200"} font-semibold`}>{opt.label}</div>
                {opt.desc && <div className="text-sm text-purple-300/70 mt-1">{opt.desc}</div>}
              </div>

              <div className="ml-3 flex items-center">
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