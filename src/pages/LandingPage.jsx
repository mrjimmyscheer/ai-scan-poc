import { motion } from "framer-motion";

export default function LandingPage({ onStart }) {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex flex-col items-center justify-center overflow-hidden relative">
      {/* Glow animatie achtergrond */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2 }}
        className="absolute w-[800px] h-[800px] rounded-full bg-purple-500 opacity-20 blur-3xl"
      />

      <div className="z-10 text-center max-w-2xl px-6">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-6xl font-extrabold tracking-wide mb-6"
        >
          Ontdek jouw <span className="text-purple-400">AI-vaardigheid</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-lg mb-10 text-white/90"
        >
          Doe de AI-scan en ontdek hoe jij AI al inzet in je onderwijspraktijk. 
          Krijg direct inzicht in je profiel en persoonlijke tips.
        </motion.p>

        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.96 }}
          className="px-10 py-4 bg-purple-600 rounded-2xl text-lg font-semibold shadow-[0_10px_30px_rgba(139,92,246,0.6)] hover:bg-purple-700 transition"
        >
          Start de Scan 🚀
        </motion.button>
      </div>
    </div>
  );
}
