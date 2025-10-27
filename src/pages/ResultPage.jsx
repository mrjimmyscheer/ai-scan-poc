import React, { useEffect, useRef, useState } from "react";
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
import { ArrowLeft, Download, Printer } from "lucide-react";
import { computeDomainScores } from "../utils/scoring";
import HeatmapTable from "../components/HeatmapTable";
import surveyJson from "../survey_nl_cleaned.json";

Chart.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const STORAGE_KEY_PREFIX = "ai-scan-session-";

function loadLastSavedSession() {
  try {
    const keys = Object.keys(localStorage || {}).filter((k) =>
      k.startsWith(STORAGE_KEY_PREFIX)
    );
    if (!keys.length) return null;

    let latest = null;
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const created = parsed.created || 0;
      if (!latest || created > latest.created) {
        latest = { key, created, data: parsed };
      }
    }

    if (!latest) return null;
    return {
      id: latest.key.replace(STORAGE_KEY_PREFIX, ""),
      answers: latest.data?.answers || {},
      created: latest.created,
    };
  } catch {
    return null;
  }
}

function makeBarOptions() {
  return {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        max: 100,
        ticks: { color: "#1e293b", font: { size: 13 } },
        grid: { color: "rgba(30,41,59,0.06)" },
      },
      y: {
        ticks: { color: "#1e293b", font: { size: 14 } },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      title: { display: false },
    },
  };
}

// async function captureFullElement(el, scale = 3, fitWidth = true) {
//   const origWidth = el.style.width;
//   const origHeight = el.style.height;

//   if (fitWidth) {
//     el.style.width = "1000px"; 
//   }
//   el.style.height = "auto";

//   const canvas = await html2canvas(el, {
//     scale,
//     useCORS: true,
//     backgroundColor: "#ffffff",
//     scrollY: -window.scrollY,
//   });

//   el.style.width = origWidth || "";
//   el.style.height = origHeight || "";

//   return canvas;
// }

export default function ResultPage({ location }) {
  const incomingState = (location && location.state) || {};
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);
  const [state, setState] = useState(() =>
    Object.keys(incomingState).length ? incomingState : null
  );

  const barRef = useRef(null);
  const chartOptions = makeBarOptions();

  useEffect(() => {
    if (state) return;
    const hist = window.history?.state?.usr;
    if (hist && Object.keys(hist).length) {
      setState(hist);
      return;
    }

    const last = loadLastSavedSession();
    if (last) {
      setState({
        sessionId: last.id,
        answers: last.answers,
        domains: surveyJson.domains || [],
      });
      setLoadedFromStorage(true);
      return;
    }

    setState({ sessionId: null, answers: {}, domains: surveyJson.domains || [] });
  }, [state]);

  const isLoading = !state;
  const domains = state?.domains || surveyJson.domains || [];
  const answers = state?.answers || {};
  const result = state ? computeDomainScores(domains, answers) : null;

  const filteredDomainResults = (result?.domains || []).filter(
    (d) => d.title !== "Toestemming voor gegevensgebruik"
  );

  async function downloadPdf() {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageW, pageH, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.text("AI Maturity Scan", pageW / 2, pageH / 2 - 20, { align: "center" });
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.text("Raport van: https://websiteurl.com/", pageW / 2, pageH / 2 + 10, { align: "center" });
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageW / 2, pageH / 2 + 20, { align: "center" });

    const chartInstance = barRef.current?.chart; 
    if (chartInstance) {
      const chartCanvas = chartInstance.toBase64Image();
      const chartWidthMM = pageW - 20; 
      const chartHeightMM = (chartInstance.height / chartInstance.width) * chartWidthMM;

      pdf.addPage();
      pdf.addImage(chartCanvas, "PNG", 10, 10, chartWidthMM, chartHeightMM);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text("© itsjimmys 2025", pageW - 40, pageH - 10);
    }

    const heatEl = document.getElementById("analysis-and-heatmap");
    if (heatEl) {
      const canvas = await html2canvas(heatEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: -heatEl.scrollLeft,
      });

      const pxToMm = (px) => (px * 25.4) / 96;
      const wmm = pxToMm(canvas.width);
      const hmm = pxToMm(canvas.height);
      const ratio = Math.min(pageW / wmm, pageH / hmm);
      const drawW = wmm * ratio;
      const drawH = hmm * ratio;

      pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageW - drawW) / 2, 10, drawW, drawH - 10);
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text("© itsjimmys 2025", pageW - 40, pageH - 10);
    }

    pdf.save(`AI-scan_resultaten_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const chartLabels = filteredDomainResults.map((d) => d.title || d.id);
  const chartDataValues = filteredDomainResults.map((d) => (d.score === null ? 0 : d.score));
  const barData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Score",
        data: chartDataValues,
        borderRadius: 8,
        barThickness: 22,
        backgroundColor: "#3b82f6",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col pb-12">
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-3xl px-4">
        <div className="flex items-center justify-between rounded-full bg-white/30 backdrop-blur-lg shadow-lg border border-white/40 px-6 py-3">
          <button onClick={() => window.history.back()} className="flex items-center text-slate-700 hover:text-slate-900 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-slate-800 text-lg tracking-tight">AI-scan Resultaten</h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition" onClick={downloadPdf}>
              <Download size={16} />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/40 text-slate-700 hover:bg-white/20 transition" onClick={() => window.print()}>
              <Printer size={16} />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-8 pt-24">
        {isLoading ? (
          <div className="p-6 min-h-[60vh] flex items-center justify-center text-slate-600 text-lg">
            Laden…
          </div>
        ) : (
          <>
            <section id="result-summary" className="p-6 rounded-2xl bg-white shadow-md border border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Samenvatting</h2>
              <p className="text-sm text-slate-500 mt-1">
                Overall score: <span className="font-semibold">{result.overall}</span> — Niveau: <span className="font-semibold">{result.level}</span>
              </p>
              {loadedFromStorage && (
                <div className="text-xs mt-2 text-amber-600">Geadviseerd: geladen uit je laatst opgeslagen sessie</div>
              )}
            </section>

            <section id="result-chart" className="p-6 rounded-2xl bg-white shadow-md border border-slate-200">
              <div className="w-full overflow-x-auto">
                <div style={{ height: Math.max(300, filteredDomainResults.length * 50) }}>
                  <Bar ref={barRef} data={barData} options={chartOptions} />
                </div>
              </div>
            </section>

            <section id="analysis-and-heatmap" className="space-y-8">
              <div className="w-full p-6 rounded-2xl bg-blue-50 shadow-md border border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-800">Aanbevelingen per domein</h3>
                <div className="space-y-3">
                  {filteredDomainResults.map((d) => (
                    <div key={d.id} className="p-3 rounded-lg border border-blue-200 bg-white shadow-sm">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-blue-800">{d.title}</div>
                        <div className="text-sm font-bold">{d.score === null ? "N.v.t." : d.score}</div>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {d.score === null
                          ? "Geen antwoorden in dit domein."
                          : d.score < 50
                          ? "Actie: Plan een korte praktische training en maak concrete rubrics."
                          : d.score < 70
                          ? "Actie: Verspreid best practices en organiseer intervisie binnen de vakgroep."
                          : "Actie: Verdiep met advanced use-cases en deel voorbeelden breed binnen de opleiding."}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full p-6 rounded-2xl bg-white shadow-md border border-slate-200">
                <h3 className="font-semibold mb-3 text-slate-800">Gedetailleerde resultaten</h3>
                <div className="text-sm text-slate-700 overflow-x-auto">
                  <HeatmapTable domainResults={filteredDomainResults} />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}