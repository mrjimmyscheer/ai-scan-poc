import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import jsPDF from "jspdf";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { computeDomainScores } from "../utils/scoring";
import surveyJson from "../survey_nl_cleaned.json";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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

function getRecommendation(score, domainId, domainsData) {
  if (score === null || !domainsData) return null;

  const domain = domainsData.find(d => d.id === domainId);
  if (!domain || !domain.recommendations) return null;

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  let adviceList = null;
  if (score < 40) {
    adviceList = domain.recommendations.find(r => r.type === 'low')?.advice;
  } else if (score < 70) {
    adviceList = domain.recommendations.find(r => r.type === 'mid')?.advice;
  } else { // score >= 70
    adviceList = domain.recommendations.find(r => r.type === 'high')?.advice;
  }

  if (!adviceList || adviceList.length === 0) return null;
  
  const selectedAdvice = pick(adviceList);
  return (score >= 90 && domain.recommendations.find(r => r.type === 'high')) ? `🎉 ${selectedAdvice} Goed gedaan!` : selectedAdvice;
}

export default function ResultPage({ location }) {
  const incomingState = (location && location.state) || {};
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);
  const [state, setState] = useState(() =>
    Object.keys(incomingState).length ? incomingState : null
  );
  const radarRef = useRef(null);

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
  const domains = state?.domains || surveyJson.domains || []; // Ensure 'domains' is available
  const answers = state?.answers || {};
  const result = state ? computeDomainScores(domains, answers) : null;

  const filteredDomainResults = (result?.domains || []).filter(
    (d) => d.title !== "Toestemming voor gegevensgebruik"
  );

  const radarLabels = filteredDomainResults.map((d) => d.title || d.id);
  const radarScores = filteredDomainResults.map((d) => (d.score === null ? 0 : d.score));

  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: "Score per domein",
        data: radarScores,
        backgroundColor: "rgba(139, 92, 246, 0.25)",
        borderColor: "#8b5cf6",
        pointBackgroundColor: "#8b5cf6",
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: "rgba(139,92,246,0.08)" },
        grid: { color: "rgba(139,92,246,0.1)" },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: { stepSize: 20, color: "#6b21a8" },
        pointLabels: { color: "#4c1d95", font: { size: 12, weight: "500" } },
      },
    },
    plugins: {
      legend: { labels: { color: "#4c1d95", font: { size: 13, weight: "500" } } },
    },
  };

  async function downloadPdf() {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // --- Voorpagina: modern en strak ---
    pdf.setFillColor(30, 144, 255); // Blauwe balk
    pdf.rect(0, 0, pageW, 50, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.text("AI Maturity Scan", pageW / 2, 30, { align: "center" });

    pdf.setFontSize(14);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Datum: ${new Date().toLocaleDateString()}`, pageW / 2, 60, { align: "center" });

    // Subtiele lijn onder header
    pdf.setDrawColor(30, 144, 255);
    pdf.setLineWidth(1);
    pdf.line(10, 65, pageW - 10, 65);

    // --- Radar chart + adviezen op pagina 2 ---
    pdf.addPage();
    let currentPage = 2;
    let y = 20;

    // Radar chart toevoegen
    const chartInstance = radarRef.current;
    if (chartInstance) {
      const chartCanvas = chartInstance.canvas;
      const ctx = chartCanvas.getContext("2d");
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "#ffffff"; // wit
      ctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);
      ctx.restore();

      const imgData = chartCanvas.toDataURL("image/jpeg", 0.8);
      const chartWidthMM = pageW - 40;
      const chartHeightMM = (chartCanvas.height / chartCanvas.width) * chartWidthMM;
      pdf.addImage(imgData, "JPEG", 20, y, chartWidthMM, chartHeightMM);
      y += chartHeightMM + 10;
    }

    // Adviezen sectie
    const adviezen = filteredDomainResults
      .filter((d) => d.score < 70 && d.score !== null)
      .map((d) => ({
        title: d.title,
        score: d.score,
        advies: getRecommendation(d.score, d.id, domains),
      }));

    if (adviezen.length) {
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Aanbevelingen per domein", 10, y);
      y += 10;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");

      adviezen.forEach((d) => {
        const textLines = pdf.splitTextToSize(d.advies, pageW - 20);

        if (y + textLines.length * 6 + 14 > pageH - 20) {
          addFooter(pdf, currentPage, pageW, pageH);
          pdf.addPage();
          currentPage++;
          y = 20;
        }

        pdf.setFont("helvetica", "bold");
        pdf.text(`${d.title} — Score: ${d.score}`, 10, y);
        y += 7;
        pdf.setFont("helvetica", "normal");
        pdf.text(textLines, 10, y);
        y += textLines.length * 6 + 4;
      });

      // Footer laatste pagina
      addFooter(pdf, currentPage, pageW, pageH);
    }

    pdf.save(`AI-scan_resultaten_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function addFooter(pdf, pageNumber, pageW, pageH) {
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.setFont("helvetica", "normal");
    pdf.text("© 2025", 10, pageH - 10); //<-- COPYRIGHT AANPASSEN OF VERWIJDEREN INDIEN NODIG!!!!!!!!!!
    if (pageNumber > 1) {
      pdf.text(`${pageNumber}`, pageW - 10, pageH - 10, { align: "right" });
    }
  }

  return (
  <div className="min-h-screen bg-gradient-to-b from-[#f7f3fb] to-[#f2e9fc] flex flex-col pb-12 print:bg-white print:text-black">
    {/* Header */}
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4 print:hidden">
      <div className="flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur-md shadow-md border border-purple-100 px-6 py-3">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-purple-800 hover:text-purple-950 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold text-purple-900 text-lg tracking-tight">
          Resultaten AI-scan
        </h1>
        <div className="flex gap-2">
          <button
            className="flex items-center justify-center p-2 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition"
            onClick={downloadPdf}
          >
            <Download size={18} />
          </button>
          <button
            className="flex items-center justify-center p-2 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-100 transition"
            onClick={() => window.print()}
          >
            <Printer size={18} />
          </button>
        </div>
      </div>
    </header>

    <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-8 pt-24">
      {isLoading ? (
        <div className="p-6 min-h-[60vh] flex items-center justify-center text-purple-600 text-lg">
          Laden…
        </div>
      ) : (
        <>
          {/* Samenvatting */}
          <section className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-sm">
            <h2 className="text-xl font-semibold text-purple-900 mb-1">Samenvatting</h2>
            <p className="text-sm text-purple-700">
              <span className="font-semibold">Totaalscore:</span> {result.overall} —{" "}
              <span className="font-semibold">Niveau:</span> {result.level}
            </p>
            {loadedFromStorage && (
              <div className="text-xs mt-2 text-amber-600">
                (Resultaten geladen uit je laatst opgeslagen sessie)
              </div>
            )}
          </section>

          {/* Radar Chart */}
          <section className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-purple-100 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-purple-900">
              Sterktes per domein
            </h3>
            <div className="w-full h-[400px] sm:h-[500px] md:h-[550px]">
              <Radar ref={radarRef} data={radarData} options={radarOptions} />
            </div>
          </section>

          {/* Adviezen */}
          <section className="space-y-4">
            <div className="w-full p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-sm print:bg-white print:border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-purple-900 print:text-black">
                Aanbevelingen voor groei
              </h3>
              <div className="space-y-3">
                {filteredDomainResults
                  .filter((d) => d.score < 70 && d.score !== null)
                  .map((d) => {
                    const advies = getRecommendation(d.score, d.id, domains);

                    const chatPrompt = encodeURIComponent(
                      `Ik heb AI Maturity test gedaan en kreeg een lage score ${d.score}/100 op het domein "${d.title}". Het advies is: "${advies}". Help me een concreet actieplan te maken om dit doel te bereiken, stap voor stap. Ik wil er niet al te lang over doen.`
                    );
                    const chatLink = `https://chat.openai.com/?model=gpt-4o&q=${chatPrompt}`;

                    return (
                      <div
                        key={d.id}
                        className="p-4 rounded-xl border border-purple-200 bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition print:shadow-none"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-medium text-purple-800 print:text-black">
                            {d.title}
                          </div>
                          <div className="text-sm font-bold text-purple-700 print:text-black">
                            {d.score}
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-purple-700 print:text-black whitespace-pre-line">
                          {advies}
                        </div>

                        <div className="mt-3 print:hidden">
                          <a
                            href={chatLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-600 text-white text-sm hover:bg-purple-500 transition"
                          >
                            💬 Werk dit uit met ChatGPT
                          </a>
                        </div>
                      </div>
                    );
                  })}
                {filteredDomainResults.every(
                  (d) => d.score >= 70 || d.score === null
                ) && (
                  <div className="text-purple-800 text-sm">
                    🎉 Geweldig! Alle domeinen scoren goed — blijf kennis delen en inspireren.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  </div>
);
}