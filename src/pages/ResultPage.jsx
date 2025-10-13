import React, { useRef } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function recommendationsFor(level) {
  if (!level) return [];
  switch (level) {
    case "Novice":
      return [
        "Begin met basisuitleg over machine learning en dataethiek.",
        "Introduceer simpele opdrachten met duidelijke beoordelingscriteria.",
      ];
    case "Intermediate":
      return [
        "Werk met casussen waarin studenten AI-output valideren.",
        "Maak afspraken over bronnen en bronvermelding bij AI-gegenereerde teksten.",
      ];
    case "Proficient":
      return [
        "Ontwerp opdrachten rondom interpretability en bias-detectie.",
        "Introduceer peer-review van model-uitkomsten.",
      ];
    case "Advanced":
      return [
        "Integreer AI-governance in curricula en onderzoeksmethodes.",
        "Ontwikkel evaluaties die verantwoordelijk gebruik belonen.",
      ];
    default:
      return [];
  }
}

export default function ResultPage({ session, restart, backToLanding }) {
  if (!session || !session.results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Geen resultaten gevonden</h2>
          <p className="mt-2 text-slate-400">Start de scan om resultaten te krijgen.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <button onClick={backToLanding} className="px-4 py-2 rounded bg-white/5">Terug</button>
          </div>
        </div>
      </div>
    );
  }

  const { overall, level, domains } = session.results;
  const recs = recommendationsFor(level);
  const chartRef = useRef();

  const chartData = {
    labels: domains.map((d) => d.title),
    datasets: [
      {
        label: "Score per domein",
        data: domains.map((d) => d.score),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
    plugins: { legend: { display: false } },
    animation: { duration: 800 },
  };

  async function downloadPDF() {
    const element = chartRef.current;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;

    pdf.text("AI Maturity Scan Resultaten", 10, 10);
    pdf.addImage(imgData, "PNG", 10, 20, width - 20, height);
    pdf.save("AI-Maturity-Resultaten.pdf");
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-16">
      <div className="max-w-3xl w-full p-6 rounded-2xl bg-slate-800/60 border border-white/5" ref={chartRef}>
        <h2 className="text-2xl font-bold">Resultaten — AI Maturity</h2>
        <p className="mt-2 text-slate-300">
          Totale score: <span className="font-semibold">{overall}%</span> — Niveau:{" "}
          <span className="font-semibold">{level}</span>
        </p>

        <div className="mt-6">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/3 rounded-lg">
            <h4 className="font-semibold">Wat dit betekent</h4>
            <p className="text-sm text-slate-200 mt-2">
              Je score geeft een indicatie van kennis, toepassing, governance en kritisch denken.
              Gebruik de aanbevelingen om concrete stappen te zetten.
            </p>
          </div>

          <div className="p-4 bg-white/4 rounded-lg">
            <h4 className="font-semibold">Aanbevelingen</h4>
            <ol className="list-disc list-inside mt-2 text-sm text-slate-200">
              {recs.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <button onClick={restart} className="px-4 py-2 rounded bg-indigo-600 text-white">
            Scan opnieuw
          </button>
          <button onClick={backToLanding} className="px-4 py-2 rounded bg-white/5">
            Terug naar start
          </button>
          <button onClick={downloadPDF} className="px-4 py-2 rounded bg-emerald-600 text-white">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}