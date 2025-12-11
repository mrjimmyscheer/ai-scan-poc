import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/Button";
import { X } from "lucide-react";

export default function Toast({ message, show, onClose }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-6 right-6 z-50 bg-secondary text-secondary-foreground px-6 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4"
        >
          <span className="font-medium">{message}</span>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
