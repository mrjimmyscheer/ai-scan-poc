import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Silk from '../components/Silk';

const STORAGE_KEY_PREFIX = "ai-scan-session-";

export default function LandingPage() {
  const navigate = useNavigate();
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    const sessions = Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_KEY_PREFIX))
      .map(k => JSON.parse(localStorage.getItem(k)));
    
    const anyAnswers = sessions.some(s => s?.answers && Object.keys(s.answers).length > 0);
    setHasResults(anyAnswers);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center text-white">
      <div className="absolute inset-0 z-0 w-full h-full">
        <Silk speed={5} scale={1.2} color="#7B3F99" noiseIntensity={1.5} rotation={0}/>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center gap-6 text-center px-6"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-purple-100 drop-shadow-lg">
          AI Maturity Scan
        </h1>

        <p className="mt-2 text-base md:text-lg text-purple-100/80 drop-shadow-sm max-w-lg">
          Een korte, praktische scan die inzicht geeft in kennis, toepassing en governance rondom AI, speciaal voor docenten en studenten.
        </p>

        <div className="mt-6 flex flex-col md:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/scan")}
            className="px-10 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-400 text-white font-semibold shadow-lg hover:brightness-110 transition-all"
          >
            Start Scan 🚀
          </motion.button>

          {hasResults && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/results")}
              className="px-10 py-3 rounded-2xl border-2 border-purple-300 text-purple-100 hover:bg-purple-700/20 transition-all"
            >
              View Results
            </motion.button>
          )}
        </div>

        <ul className="mt-4 text-xs md:text-sm text-purple-100/60 space-y-1 max-w-xs">
          <li>• Duur: ~5–8 minuten — één vraag per keer.</li>
          <li>• Resultaat: maturity-niveau + aanbevelingen.</li>
          <li className="font-bold">• Privacy: data blijft lokaal in de browser.</li>
        </ul>
      </motion.div>
    </div>
  );
}