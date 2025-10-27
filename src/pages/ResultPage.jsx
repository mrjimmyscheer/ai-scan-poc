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

function getRecommendation(score, title) {
  if (score === null) return null;

  const s = score;
  const t = title.toLowerCase();

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const domainAdvice = {
    "begrip van het gebruik van generatieve ai door studenten": { // <-- Temporary, kun je altijd aanpassen, chatgpt heeft dit gegenereerd, maar lijkt oke?
      low: [
        "Volg een korte workshop over AI-gebruik door studenten en bespreek voorbeelden van verantwoord gebruik in jouw les.",
        "Lees meer over AI-geletterdheid bij studenten: https://www.surf.nl/ai-in-het-onderwijs",
        "Ontwerp een mini-les waarin studenten reflecteren op hun eigen AI-gebruik.",
      ],
      mid: [
        "Integreer AI-ethiek in opdrachten. Laat studenten bespreken hoe AI hun leerproces beïnvloedt.",
        "Gebruik tools zoals ChatGPT als voorbeeld, en bespreek de voor- en nadelen in kleine groepen.",
      ],
      high: [
        "Je begeleidt studenten al goed! Overweeg om jouw aanpak te delen met collega’s via een workshop of artikel.",
        "Organiseer een studentendialoog over verantwoord AI-gebruik om bewustwording te vergroten.",
      ],
    },

    "menselijke controle en toezicht": {
      low: [
        "Leer meer over ‘human-in-the-loop’-principes. Zie: https://www.ibm.com/blogs/research/2020/11/human-in-the-loop-ai/",
        "Oefen met het valideren van AI-output — bijvoorbeeld door AI-resultaten te vergelijken met menselijke beoordelingen.",
      ],
      mid: [
        "Maak AI-toezicht onderdeel van je workflow. Plan vaste momenten om AI-output te checken.",
        "Gebruik voorbeelden uit je onderwijspraktijk om te bespreken waar menselijke controle essentieel is.",
      ],
      high: [
        "Fantastisch! Je past menselijke controle goed toe. Deel je werkwijze in je team en inspireer anderen.",
      ],
    },

    transparantie: {
      low: [
        "Volg een microlearning over uitlegbaarheid van AI: https://teachingai.eu/",
        "Probeer AI-beslissingen in je eigen woorden uit te leggen — dat helpt studenten begrijpen hoe AI werkt.",
      ],
      mid: [
        "Ontwikkel een korte oefening waarin studenten uitleggen waarom een AI-tool iets ‘vindt’.",
        "Gebruik tools met ‘explain’ functies (zoals Copilot of Grammarly) om transparantie te demonstreren.",
      ],
      high: [
        "Top! Je stimuleert AI-transparantie. Deel je uitlegvoorbeelden met collega’s als best practice.",
      ],
    },

    "verbetering van onderwijskwaliteit met ai": {
      low: [
        "Bekijk een webinar over AI in onderwijsinnovatie: https://www.surf.nl/webinar-ai-in-het-onderwijs",
        "Start met een kleine AI-toepassing, zoals automatische feedback of samenvattingstools.",
      ],
      mid: [
        "Gebruik AI voor differentiatie of leerondersteuning — probeer tools zoals ChatGPT of EduGPT met duidelijke instructies.",
        "Werk samen met collega’s om AI te gebruiken bij reflectie of peer feedback.",
      ],
      high: [
        "Knap werk! Jij benut AI al effectief. Denk na over het ontwikkelen van een best practice of training voor je team.",
      ],
    },

    algoritmekennis: {
      low: [
        "Bekijk de gratis cursus ‘Elements of AI’: https://www.elementsofai.com/nl/",
        "Leer over hoe algoritmes werken via korte video’s van AI Campus NL.",
      ],
      mid: [
        "Verdiep je in termen als ‘dataset’, ‘bias’, en ‘parameter’. Dit versterkt je algoritmebegrip.",
        "Bespreek met collega’s hoe AI-modellen beslissingen nemen — leer van elkaars inzichten.",
      ],
      high: [
        "Geweldig! Jij begrijpt hoe algoritmes werken. Overweeg een lezing of training te geven voor collega’s.",
      ],
    },

    "eerlijkheid en inclusiviteit": {
      low: [
        "Lees meer over bias in AI: https://teachingai.eu/resources/bias",
        "Evalueer AI-tools op inclusiviteit — laat studenten voorbeelden zoeken van niet-neutrale output.",
      ],
      mid: [
        "Organiseer een gesprek over gelijke kansen bij AI-gebruik in het onderwijs.",
        "Gebruik scenario’s om te laten zien hoe AI per ongeluk oneerlijk kan zijn.",
      ],
      high: [
        "Geweldig dat je aandacht hebt voor inclusiviteit! Blijf AI kritisch bekijken en inspireer anderen.",
      ],
    },

    "maatschappelijk en milieu-impact": {
      low: [
        "Onderzoek de ecologische voetafdruk van AI via: https://aiandclimate.org/",
        "Bespreek met studenten hoe AI invloed heeft op banen en duurzaamheid.",
      ],
      mid: [
        "Vergelijk de maatschappelijke voor- en nadelen van AI in je vakgebied.",
        "Stimuleer studenten om kritisch na te denken over AI-ethiek en duurzaamheid.",
      ],
      high: [
        "Prima werk! Je betrekt maatschappelijke thema’s actief bij AI-gebruik. Blijf dat uitdragen.",
      ],
    },

    verantwoording: {
      low: [
        "Maak een simpel reflectieverslag over hoe AI je onderwijs beïnvloedt.",
        "Plan een overleg met je team over gezamenlijke verantwoording en reflectie op AI-gebruik.",
      ],
      mid: [
        "Gebruik een logboek of checklist om AI-toepassingen te evalueren.",
        "Evalueer de impact van AI op leeruitkomsten en deel die inzichten met collega’s.",
      ],
      high: [
        "Top! Je reflecteert en verantwoordt actief. Overweeg om jouw evaluatiemethode te publiceren of te delen.",
      ],
    },
  };

  const domain = domainAdvice[t];
  if (!domain) return null;

  if (s < 40) return pick(domain.low);
  if (s < 70) return pick(domain.mid);
  if (s >= 90) return `🎉 ${pick(domain.high)} Goed gedaan!`; //<-- laat gebruiker blij zijn vanaf 90 punten per domein.
  return pick(domain.high);
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
  const domains = state?.domains || surveyJson.domains || [];
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
        advies: getRecommendation(d.score, d.title),
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
                    const advies = getRecommendation(d.score, d.title);

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