import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/Button";

export default function Modal({ show, title, children, onClose, actions }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="bg-card/95 backdrop-blur-md border p-6 rounded-3xl shadow-2xl w-full max-w-md flex flex-col"
          >
            <h2 className="text-xl font-semibold text-chart-4 mb-4">{title}</h2>
            <div className="flex-1 text-card-foreground mb-6 space-y-4">{children}</div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={onClose}
                variant="secondary"
              >
                Sluiten
              </Button>
              {actions && actions.map((act, i) => (
                <Button
                  key={i}
                  onClick={act.onClick}
                  variant={act.variant === "primary" ? "default" : act.variant === "danger" ? "destructive" : "secondary"}
                >
                  {act.label}
                </Button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
