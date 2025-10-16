import React from "react";

export default function HeatmapModal({ item, onClose }) {
  if (!item) return null;

  const { id, text, score, domain, explain } = item;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          width: "90%",
          maxWidth: 480,
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Vraag {id}</h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "#475569"
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{domain}</div>
          <div style={{ fontSize: 14, color: "#0f172a", marginBottom: 8 }}>{text}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
            Score: {score === null ? "Niet beantwoord" : `${score} / 100`}
          </div>
          {explain && (
            <div style={{ fontSize: 13, color: "#334155", marginTop: 10, lineHeight: 1.5 }}>
              <strong>Toelichting:</strong> {explain}
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              background: "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 14
            }}
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}