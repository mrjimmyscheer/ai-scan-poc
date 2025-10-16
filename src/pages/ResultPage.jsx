import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { computeDomainScores } from "../utils/scoring";
import HeatmapTable from "../components/HeatmapTable";
import surveyJson from "../survey_nl_cleaned.json";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function barColor(score) {
  if (score === null || score === undefined) return "#c7cbd6";
  if (score >= 75) return "rgb(16,185,129)";
  if (score >= 50) return "rgb(250,204,21)";
  return "rgb(244,63,94)";
}

function makeBarData(domainResults) {
  const labels = domainResults.map((d) => d.title);
  const data = domainResults.map((d) => (d.score === null ? 0 : d.score));
  return {
    labels,
    datasets: [
      {
        label: "Score (0–100)",
        data,
        backgroundColor: data.map((d) => barColor(d)),
      },
    ],
  };
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "AI-maturity per domein", font: { size: 18 } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)} / 100`,
        },
      },
    },
    scales: {
      x: { ticks: { color: "#0f172a", font: { size: 13 } } },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: "#0f172a", font: { size: 13 } },
        grid: { color: "rgba(15,23,42,0.08)" },
      },
    },
  };
}

async function captureElementAsCanvas(el, scale = 3) {
  const origBg = el.style.backgroundColor;
  if (!origBg || origBg === "transparent") el.style.backgroundColor = "#ffffff";
  const canvas = await html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: document.documentElement.scrollWidth,
    windowHeight: document.documentElement.scrollHeight,
  });
  el.style.backgroundColor = origBg || "";
  return canvas;
}

export default function ResultPage({ location }) {
  const state = (location && location.state) || (window.history?.state && window.history.state?.usr) || {};
  const domains = state.domains || surveyJson.domains || [];
  const answers = state.answers || {};

  const result = computeDomainScores(domains, answers);
  const domainResults = result.domains || [];

  const barRef = useRef(null);
  const weakRef = useRef(null);
  const heatRef = useRef(null);

  useEffect(() => {
    const resize = () => {
      if (barRef.current) barRef.current.style.height = window.innerWidth < 640 ? "320px" : "420px";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  async function exportThreePagePdf() {
    if (!barRef.current || !weakRef.current || !heatRef.current) {
      alert("Grafieken nog niet geladen.");
      return;
    }

    const canv1 = await captureElementAsCanvas(barRef.current, 3);
    const canv2 = await captureElementAsCanvas(weakRef.current, 3);
    const canv3 = await captureElementAsCanvas(heatRef.current, 2);

    const img1 = canv1.toDataURL("image/png", 1.0);
    const img2 = canv2.toDataURL("image/png", 1.0);
    const img3 = canv3.toDataURL("image/png", 1.0);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const pxToMm = (px) => (px * 25.4) / 96;

    function addImageCentered(imgData, canvas) {
      const wmm = pxToMm(canvas.width);
      const hmm = pxToMm(canvas.height);
      const margin = 10;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = Math.min(maxW / wmm, maxH / hmm);
      const drawW = wmm * ratio;
      const drawH = hmm * ratio;
      pdf.addImage(imgData, "PNG", (pageW - drawW) / 2, (pageH - drawH) / 2, drawW, drawH, undefined, "FAST");
    }

    addImageCentered(img1, canv1);
    pdf.addPage();
    addImageCentered(img2, canv2);
    pdf.addPage();
    addImageCentered(img3, canv3);

    const filename = `AI-scan-resultaten_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(filename);
  }

  return (
    <div className="p-4 min-h-screen bg-slate-50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Resultaten — AI Scan</h1>
        <div className="text-sm text-slate-600">Overzicht: {result.overall ?? "N.v.t."} — {result.level ?? ""}</div>

        <div className="mt-3 flex gap-2">
          <button onClick={exportThreePagePdf} className="px-3 py-2 rounded bg-sky-600 text-white">Download PDF (3 pagina's)</button>

          <button onClick={() => {
            const csv = computeDomainScores(domains, answers, { exportCsv: true }).csv;
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ai-scan-export_${(new Date()).toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }} className="px-3 py-2 rounded border">Export CSV</button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div ref={barRef} style={{ minHeight: 420, background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 2px 6px rgba(2,6,23,0.06)" }}>
          <Bar data={makeBarData(domainResults)} options={chartOptions()} />
        </div>

        <div ref={weakRef} style={{ minHeight: 420, background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 2px 6px rgba(2,6,23,0.06)" }}>
          <h3 className="text-lg font-semibold mb-2">Zwakke punten (bottom 5 items)</h3>
          <WeakList domainResults={domainResults} />
        </div>
      </div>

      <div className="mt-6" style={{ background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 2px 6px rgba(2,6,23,0.06)" }}>
        <h2 className="text-xl font-semibold mb-3">Heatmap — itemniveau</h2>
        <div ref={heatRef}>
          <HeatmapTable domainResults={domainResults} maxColumns={30} />
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Aanbevelingen</h2>
        <Recommendations domainResults={domainResults} />
      </div>
    </div>
  );
}

function WeakList({ domainResults }) {
  const all = [];
  domainResults.forEach((d) => {
    (d.items || []).forEach((it) => {
      if (it.itemScore !== null && it.itemScore !== undefined) {
        all.push({ domainTitle: d.title, id: it.id, text: it.text, score: it.itemScore, explain: it.explain });
      }
    });
  });
  all.sort((a, b) => a.score - b.score);
  const slice = all.slice(0, 5);
  if (slice.length === 0) return <div>Geen beantwoorde vragen gevonden.</div>;
  return (
    <ul>
      {slice.map((s) => (
        <li key={s.id} className="mb-2">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="font-medium">{s.text}</div>
              <div className="text-xs text-slate-500">{s.domainTitle}</div>
              {s.explain && <div className="text-xs mt-1 text-slate-600">Toelichting: {s.explain}</div>}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{s.score}</div>
              <div className="text-xs">/100</div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Recommendations({ domainResults }) {
  return (
    <div className="grid gap-3">
      {domainResults.map((d) => (
        <div key={d.id} className="p-3 rounded border bg-white/90">
          <div className="flex justify-between">
            <div className="font-semibold">{d.title}</div>
            <div className="font-bold">{d.score === null ? "N.v.t." : d.score}</div>
          </div>
          <div className="mt-2 text-sm text-slate-700">
            {d.score === null ? "Geen antwoorden in dit domein." : (d.score < 50 ? (
              <div>Actie: Plan een korte praktische training en maak concrete rubrics.</div>
            ) : d.score < 70 ? (
              <div>Actie: Verspreid best practices en organiseer intervisie binnen de vakgroep.</div>
            ) : (
              <div>Actie: Verdiep met advanced use-cases en deel voorbeelden breed binnen de opleiding.</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}