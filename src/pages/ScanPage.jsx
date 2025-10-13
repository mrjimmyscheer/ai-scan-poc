import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import QuestionCard from "../components/QuestionCard";
import Navbar from "../components/Navbar";

const levels = [
  {
    naam: "Level 1 – Basiskennis",
    domein: "kennis",
    vragen: [
      "Ik begrijp de basisprincipes van AI.",
      "Ik weet welke AI-tools beschikbaar zijn voor docenten.",
      "Ik heb vertrouwen in mijn eigen digitale vaardigheden."
    ]
  },
  {
    naam: "Level 2 – Praktisch gebruik",
    domein: "praktijk",
    vragen: [
      "Ik gebruik AI om lesmateriaal of opdrachten te ontwikkelen.",
      "Ik laat studenten AI inzetten voor brainstorm of tekstverbetering.",
      "Ik begeleid studenten bij verantwoord AI-gebruik."
    ]
  },
  {
    naam: "Level 3 – Didactische integratie",
    domein: "didactiek",
    vragen: [
      "Ik stem AI-gebruik af op leerdoelen en toetsvormen.",
      "Ik gebruik AI om leertrajecten te personaliseren.",
      "Ik ontwerp opdrachten waarbij studenten kritisch leren omgaan met AI-output."
    ]
  },
  {
    naam: "Level 4 – Professionalisering",
    domein: "professionaliteit",
    vragen: [
      "Ik deel AI-ervaringen met collega’s.",
      "Ik volg actief de ontwikkelingen rond AI in het onderwijs.",
      "Ik bespreek ethische aspecten van AI met mijn studenten."
    ]
  }
];

export default function ScanPage({ answers, setAnswers, onFinish }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [vraagIndex, setVraagIndex] = useState(0);

  function beantwoord(score) {
    const domein = levels[levelIndex].domein;
    const vraag = levels[levelIndex].vragen[vraagIndex];

    setAnswers(prev => {
      const updated = { ...prev };
      if (!updated[domein]) updated[domein] = [];
      updated[domein][vraagIndex] = { vraag, score };
      return updated;
    });
  }

  function volgendeVraag() {
    if (vraagIndex < levels[levelIndex].vragen.length - 1) {
      setVraagIndex(vraagIndex + 1);
    } else if (levelIndex < levels.length - 1) {
      setLevelIndex(levelIndex + 1);
      setVraagIndex(0);
    }
  }

  function gaNaarVraag(lIndex, vIndex) {
    setLevelIndex(lIndex);
    setVraagIndex(vIndex);
  }

  const alleBeantwoord = useMemo(() => 
    levels.every((l) => (answers[l.domein]?.length || 0) === l.vragen.length),
    [answers]
  );

  const totaalVragen = useMemo(() => levels.reduce((sum, l) => sum + l.vragen.length, 0), []);
  const aantalBeantwoord = useMemo(() =>
    Object.values(answers).reduce((sum, list) => sum + list.filter(Boolean).length, 0),
    [answers]
  );
  const progressPct = Math.round((aantalBeantwoord / totaalVragen) * 100);

  return (
    <div className="flex flex-col h-screen">
      <Navbar onHome={() => window.location.reload()} />
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-2">
        <div className="h-2 bg-purple-600 transition-all" style={{ width: progressPct + '%' }} />
      </div>

      <div className="flex flex-1">
        <Sidebar
          levels={levels}
          answers={answers}
          currentLevel={levelIndex}
          currentVraag={vraagIndex}
          goToQuestion={gaNaarVraag}
        />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
          <QuestionCard
            vraag={levels[levelIndex].vragen[vraagIndex]}
            antwoord={answers[levels[levelIndex].domein]?.[vraagIndex]}
            onAnswer={beantwoord}
            onNext={volgendeVraag}
          />
        </div>
      </div>

      {alleBeantwoord && (
        <button
          onClick={onFinish}
          className="absolute bottom-6 right-6 px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700"
        >
          Naar Resultaten ✅
        </button>
      )}
    </div>
  );
}
