import React, { useState } from "react";
import HeatmapModal from "./HeatmapModal";

function scoreToColor(score) {
  if (score === null || score === undefined) return "#efefef";
  const s = Math.max(0, Math.min(100, Number(score)));
  if (s <= 50) {
    const t = s / 50;
    const r = 255;
    const g = Math.round(59 + (204 - 59) * t);
    const b = Math.round(48 + (0 - 48) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = (s - 50) / 50;
    const r = Math.round(255 + (16 - 255) * t);
    const g = Math.round(204 + (185 - 204) * t);
    const b = Math.round(0 + (129 - 0) * t);
    return `rgb(${r},${g},${b})`;
  }
}

export default function HeatmapTable({ domainResults = [], maxColumns = 20 }) {
  const [selected, setSelected] = useState(null);

  const columns = [];
  const qidSet = new Set();
  domainResults.forEach(d => {
    d.items.forEach(it => {
      if (!qidSet.has(it.id)) {
        qidSet.add(it.id);
        columns.push({ id: it.id, text: it.text });
      }
    });
  });

  const displayColumns = columns.slice(0, maxColumns);

  return (
    <div className="heatmap-root" style={{ overflowX: "auto" }}>
      {/* legenda */}
      <div style={{ marginBottom: 8, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>Scorekleurverloop</div>
        <div
          style={{
            height: 16,
            width: "100%",
            maxWidth: 420,
            margin: "0 auto",
            background:
              "linear-gradient(to right, rgb(244,63,94) 0%, rgb(250,204,21) 50%, rgb(16,185,129) 100%)",
            borderRadius: 8
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 420, margin: "2px auto 8px auto", fontSize: 11, color: "#475569" }}>
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* heatmap table */}
      <table
        className="heatmap-table"
        style={{ borderCollapse: "collapse", minWidth: Math.max(600, displayColumns.length * 120) }}
      >
        <thead>
          <tr>
            <th style={thStyle}>Domein / Vraag</th>
            {displayColumns.map(col => (
              <th key={col.id} style={{ ...thStyle, minWidth: 120 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{col.id}</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: "#334155" }}>{col.text}</div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {domainResults.map(domain => (
            <tr key={domain.domainId}>
              <td
                style={{
                  ...tdStyle,
                  width: 240,
                  verticalAlign: "top",
                  padding: "10px",
                  background: "#f8fafc"
                }}
              >
                <div style={{ fontWeight: 700 }}>{domain.title}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>{domain.domainId}</div>
              </td>

              {displayColumns.map(col => {
                const found = domain.items.find(it => it.id === col.id);
                const score = found ? found.score ?? found.itemScore ?? null : null;
                const bg = score === null ? "#f3f4f6" : scoreToColor(score);
                const textColor = "#071133";
                return (
                  <td
                    key={col.id}
                    style={{
                      ...tdStyle,
                      background: bg,
                      textAlign: "center",
                      padding: "6px",
                      verticalAlign: "middle",
                      minWidth: 120,
                      cursor: found ? "pointer" : "default",
                      transition: "transform 0.1s ease"
                    }}
                    aria-label={`Vraag ${col.id} in ${domain.title}: ${score === null ? "Niet beantwoord" : score + " van 100"}`}
                    title={found ? `${found.text}\nScore: ${score === null ? "Niet beantwoord" : score + " / 100"}` : "Niet van toepassing"}
                    onClick={() => found && setSelected({ ...found, domain: domain.title })}
                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={e => (e.currentTarget.style.transform = "scale(1.0)")}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: textColor }}>
                      {score === null ? "-" : `${score}`}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selected && <HeatmapModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  color: "#0f172a"
};

const tdStyle = {
  borderBottom: "1px solid #e6eef6",
  padding: "8px",
  color: "#0f172a"
};