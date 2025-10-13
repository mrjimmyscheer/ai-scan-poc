import { useEffect, useRef, useMemo } from "react";
import { Chart } from "chart.js/auto";
import html2pdf from "html2pdf.js";
import Navbar from "../components/Navbar";

const levels = [
  { naam: "Level 1 – Basiskennis", domein: "kennis" },
  { naam: "Level 2 – Praktisch gebruik", domein: "praktijk" },
  { naam: "Level 3 – Didactische integratie", domein: "didactiek" },
  { naam: "Level 4 – Professionalisering", domein: "professionaliteit" }
];

export default function ResultPage({ answers }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const domeinScores = useMemo(() => 
    levels.map((l) => (answers[l.domein] || []).reduce((a, b) => a + b.score, 0)),
    [answers]
  );

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();

      chartInstance.current = new Chart(chartRef.current, {
        type: "radar",
        data: {
          labels: levels.map((l) => l.naam),
          datasets: [
            {
              label: "AI Scan Profiel",
              data: domeinScores,
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 2,
            },
          ],
        },
        options: {
          scales: {
            r: {
              angleLines: { color: 'rgba(0,0,0,0.1)' },
              grid: { color: 'rgba(0,0,0,0.1)' }
            }
          }
        }
      });
    }
  }, [domeinScores]);

  function downloadPDF() {
    const element = document.getElementById("resultaten");
    const opt = {
      margin: 0.5,
      filename: "ai-scan-resultaten.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  }

  function profiel() {
    const totaal = Object.values(answers)
      .flat()
      .reduce((a, b) => a + b.score, 0);

    if (totaal < 25) return "Beginner – Je staat aan het begin van je AI-reis.";
    if (totaal < 40) return "Gevorderd – Je gebruikt AI al regelmatig.";
    return "Expert – Je bent een AI-pionier in je onderwijs!";
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onHome={() => window.location.reload()} />
      <div id="resultaten" className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Jouw Resultaten</h1>

        <div className="bg-white/90 shadow-lg rounded-2xl p-6 mb-8 border border-gray-200">
          <canvas ref={chartRef} className="mx-auto mb-2" style={{ maxWidth: "420px" }} />
          <p className="text-center text-xl font-semibold mt-4">{profiel()}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {levels.map((level) => (
            <div key={level.naam} className="bg-white/90 shadow rounded-xl p-6 border border-gray-200">
              <h2 className="font-semibold text-lg mb-3">{level.naam}</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {(answers[level.domein] || []).map((a, i) => (
                  <li key={i}>{a.vraag} → <strong>{a.score}</strong></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={downloadPDF}
            className="mt-8 px-6 py-3 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700"
          >
            Download als PDF
          </button>
        </div>
      </div>
    </div>
  );
}
