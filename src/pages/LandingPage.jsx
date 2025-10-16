import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-50 overflow-hidden relative">

      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl animate-float-slow" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl animate-float-slow-delay" />

      <div className="relative max-w-4xl w-full rounded-3xl p-10 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden border border-white/5 flex flex-col md:flex-row items-center gap-8">

        <div className="flex-1">
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white"
          >
            AI Maturity Scan
          </motion.h1>

          <motion.p
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-4 text-slate-300 text-lg"
          >
            Een korte, praktische scan die inzicht geeft in kennis, toepassing en governance rondom AI — speciaal voor docenten en studenten.
          </motion.p>

          <div className="mt-8 flex flex-wrap gap-4">
            <motion.button
              onClick={() => navigate("/scan")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="relative px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:brightness-110 transition-all"
            >
              Start de scan 🚀
            </motion.button>

            <motion.button
              onClick={() => navigate("/results")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-2xl border border-slate-600 text-slate-100 bg-transparent hover:bg-white/10 transition-all"
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 hidden md:block"
        >
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-white/5 shadow-lg">
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
  );
}