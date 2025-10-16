import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50">
      <div className="relative max-w-4xl w-full rounded-3xl p-8 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/5">

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
          {/* Left side */}
          <div>
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
            >
              AI Maturity Scan
            </motion.h1>

            <motion.p
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="mt-4 text-slate-300"
            >
              Een korte, praktische scan die inzicht geeft in kennis, toepassing en governance rondom AI — speciaal voor docenten en studenten.
            </motion.p>

            <div className="mt-8 flex flex-wrap gap-3">
              <motion.button
                onClick={() => navigate("/scan")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-medium shadow-lg hover:brightness-110 transition"
              >
                Start de scan 🚀
              </motion.button>

              <motion.button
                onClick={() => navigate("/results")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-2xl border border-slate-600 text-slate-100 bg-transparent hover:bg-white/10 transition"
              >
                Bekijk resultaten
              </motion.button>
            </div>

            <ul className="mt-6 text-sm text-slate-400 space-y-2 leading-relaxed">
              <li>• Duur: ~5–8 minuten — één vraag per keer, gefocust.</li>
              <li>• Resultaat: duidelijk maturity-niveau + aanbevelingen.</li>
              <li>• Privacy: data blijft lokaal in je browser.</li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hidden md:block"
          >
            <div className="p-6 rounded-xl bg-slate-800/40 border border-white/5">
              <h3 className="font-semibold mb-3 text-lg text-white">Wat meten we?</h3>
              <ol className="list-decimal list-inside text-slate-300 space-y-2">
                <li>Kennis van AI-concepten</li>
                <li>Toepassing in onderwijs of onderzoek</li>
                <li>Ethische & organisatorische bewustheid</li>
                <li>Critisch beoordelingsvermogen</li>
              </ol>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}