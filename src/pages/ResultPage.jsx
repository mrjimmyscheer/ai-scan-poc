import React, { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Radar } from "react-chartjs-2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function recommendationsFor(level) {
  switch (level) {
    case "Novice":
      return ["Basis uitleg over AI.", "Simpele opdrachten."];
    case "Intermediate":
      return ["Case studies AI-validatie.", "Bronvermelding bij AI-teksten."];
    case "Proficient":
      return ["Interpretability & bias-opdrachten.", "Peer-review van output."];
    case "Advanced":
      return ["AI-governance integreren.", "Evaluaties verantwoord gebruik."];
    default:
      return [];
  }
}

export default function ResultPage({ session, restart, backToLanding }) {
  const chartRef = useRef();

  useEffect(() => {
    console.log("Session results:", session?.results);
  }, [session]);

  if (!session || !session.results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Geen resultaten gevonden</h2>
          <p className="mt-2 text-slate-400">Start de scan om resultaten te krijgen.</p>
          <div className="mt-4 flex gap-3 justify-center">
            <button onClick={backToLanding} className="px-4 py-2 rounded bg-white/5">
              Terug
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { overall, level, domains } = session.results;

  console.log("Domains:", domains);

  const radarData = {
    labels: domains.map((d) => d.title),
    datasets: [
      {
        label: "AI Maturity per domein",
        data: domains.map((d) => d.score),
        backgroundColor: "rgba(99,102,241,0.3)",
        borderColor: "rgba(99,102,241,0.8)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(99,102,241,0.8)",
      },
    ],
  };

  const radarOptions = { scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } }, plugins: { legend: { display: false } } };

  const barData = {
    labels: domains.map((d) => d.title),
    datasets: [
      { label: "Score per domein", data: domains.map((d) => d.score), backgroundColor: "rgba(99,102,241,0.8)" },
    ],
  };

  const barOptions = { responsive: true, scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } };

  const domainRecs = domains.map((d) =>
    d.score < 40 ? `Versterk kennis in ${d.title}` : d.score < 70 ? `Werk aan verdieping van ${d.title}` : `Goed gedaan in ${d.title}, blijf toepassen`
  );

  async function downloadPDF() {
    if (!chartRef.current) return;

    const element = chartRef.current;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth() - 20;
    const pageHeight = pdf.internal.pageSize.getHeight() - 20; 

    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.text("AI Maturity Scan Resultaten", 10, 10);
      pdf.addImage(imgData, "PNG", 10, 20, pageWidth, imgHeight);
    } else {
      let remainingHeight = canvas.height;
      let position = 0;
      const pdfPageHeight = (canvas.height * pageWidth) / canvas.width * (pageHeight / imgHeight);

      pdf.text("AI Maturity Scan Resultaten", 10, 10);

      while (remainingHeight > 0) {
        const canvasPage = document.createElement("canvas");
        canvasPage.width = canvas.width;
        canvasPage.height = Math.min(remainingHeight, canvas.height);

        const ctx = canvasPage.getContext("2d");
        ctx.drawImage(
          canvas,
          0,
          position,
          canvas.width,
          canvasPage.height,
          0,
          0,
          canvas.width,
          canvasPage.height
        );

        const imgPage = canvasPage.toDataURL("image/png");
        const h = (canvasPage.height * pageWidth) / canvas.width;

        pdf.addImage(imgPage, "PNG", 10, 20, pageWidth, h);
        remainingHeight -= canvasPage.height;
        position += canvasPage.height;

        if (remainingHeight > 0) pdf.addPage();
      }
    }

    pdf.save("AI-Maturity-Resultaten.pdf");
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-16">
      <div ref={chartRef} className="max-w-3xl w-full p-6 rounded-2xl bg-slate-800/60 border border-white/5">
        <h2 className="text-2xl font-bold">Resultaten — AI Maturity</h2>
        <p className="mt-2 text-slate-300">
          Totale score: <span className="font-semibold">{overall}%</span> — Niveau: <span className="font-semibold">{level}</span>
        </p>

        <div className="mt-6">
          <Radar data={radarData} options={radarOptions} />
        </div>
        <div className="mt-6">
          <Bar data={barData} options={barOptions} />
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/3 rounded-lg">
            <h4 className="font-semibold">Wat dit betekent</h4>
            <p className="text-sm text-slate-200 mt-2">
              Je score geeft een indicatie van kennis, toepassing, governance en kritisch denken.
            </p>
          </div>

          <div className="p-4 bg-white/4 rounded-lg">
            <h4 className="font-semibold">Aanbevelingen per domein</h4>
            <ol className="list-disc list-inside mt-2 text-sm text-slate-200">
              {domainRecs.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>
        </div>

        <div className="mt-6 flex gap-3 flex-wrap">
          <button onClick={restart} className="px-4 py-2 rounded bg-indigo-600 text-white">Scan opnieuw</button>
          <button onClick={backToLanding} className="px-4 py-2 rounded bg-white/5">Terug naar start</button>
          <button onClick={downloadPDF} className="px-4 py-2 rounded bg-emerald-600 text-white">Download PDF</button>
        </div>
      </div>
    </div>
  );
}