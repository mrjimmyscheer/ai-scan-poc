import React from "react";
import { motion } from "framer-motion";

export default function QuestionCard({ question, selected, onAnswer }) {
  return (
    <div className="bg-slate-800/70 border border-white/5 rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{question.title}</h3>
        {question.text && <p className="text-sm text-slate-400 mt-1">{question.text}</p>}
      </div>

      <div className="grid gap-3">
        {question.options.map((opt) => {
          const isSelected = selected === opt.key;
          return (
            <motion.button
              key={opt.key}
              onClick={() => onAnswer(opt.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`text-left p-3 rounded-xl border transition ${isSelected ? "bg-indigo-600/80 border-indigo-500 text-white" : "bg-white/3 border-white/6 text-slate-100"}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{opt.label}</div>
                </div>
                <div className="text-sm text-slate-300 ml-4"> 
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}