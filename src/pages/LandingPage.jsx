import React from "react";
import { motion } from "framer-motion";

export default function LandingPage({ onStart, resume, hasSaved, clearSaved }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="relative max-w-4xl w-full rounded-3xl p-8 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md shadow-2xl overflow-hidden">
        <svg className="pointer-events-none absolute -z-10 inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id="g1" cx="30%" cy="40%" r="40%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#7c3aed" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="g2" cx="80%" cy="70%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.30" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="220" cy="180" r="260" fill="url(#g1)">
            <animate attributeName="r" dur="8s" values="250;270;250" repeatCount="indefinite" />
          </circle>
          <circle cx="620" cy="420" r="300" fill="url(#g2)">
            <animate attributeName="r" dur="10s" values="290;310;290" repeatCount="indefinite" />
          </circle>
        </svg>

        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <motion.h1 initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="text-4xl md:text-5xl font-extrabold tracking-tight">
              AI Maturity Scan
            </motion.h1>
            <motion.p initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.6 }} className="mt-4 text-slate-300">
              Een korte, praktische scan voor docenten en studenten die inzicht geeft in kennis, toepassing en governance rondom AI.
            </motion.p>

            <div className="mt-6 flex flex-wrap gap-3">
              <motion.button onClick={onStart} whileHover={{ scale: 1.03 }} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-medium shadow hover:brightness-105">
                Start de scan 🚀
              </motion.button>

              {hasSaved && (
                <>
                  <motion.button onClick={resume} whileHover={{ scale: 1.03 }} className="px-5 py-3 rounded-2xl border border-slate-600 text-slate-100">
                    Hervat
                  </motion.button>
                  <motion.button onClick={clearSaved} whileHover={{ scale: 1.03 }} className="px-4 py-3 rounded-2xl text-slate-100 bg-transparent hover:bg-white/5">
                    Verwijder opgeslagen sessie
                  </motion.button>
                </>
              )}
            </div>

            <ul className="mt-6 text-sm text-slate-400 space-y-2">
              <li>• Duur: ~5–8 minuten — één vraag tegelijk, gefocuste interface.</li>
              <li>• Resultaat: concreet maturity-level + aanbevelingen.</li>
              <li>• Privacy: antwoorden blijven in je browser (localStorage)—geen externe verzending.</li>
            </ul>
          </div>

          <div className="hidden md:block">
            <div className="p-6 rounded-xl bg-slate-800/40 border border-white/5">
              <h3 className="font-semibold mb-3">Wat meten we?</h3>
              <ol className="list-decimal list-inside text-slate-300 space-y-2">
                <li>Kennis van AI-concepten</li>
                <li>Toepassing in onderwijs of onderzoek</li>
                <li>Ethische & organisatorische bewustheid</li>
                <li>Critisch beoordelingsvermogen</li>
              </ol>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}