export default function Sidebar({ levels, answers, currentLevel, currentVraag, goToQuestion }) {
  return (
    <aside className="w-72 bg-gray-900 text-white p-4 flex-shrink-0 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Voortgang</h2>
      {levels.map((level, lIndex) => (
        <div key={level.naam} className="mb-4">
          <h3 className={`font-semibold ${lIndex === currentLevel ? "text-purple-400" : ""}`}>
            {level.naam}
          </h3>
          <ul className="ml-2 space-y-1 mt-2">
            {level.vragen.map((vraag, vIndex) => {
              const beantwoord = answers[level.domein]?.[vIndex] !== undefined;
              const active = lIndex === currentLevel && vIndex === currentVraag;
              return (
                <li key={vIndex}>
                  <button
                    onClick={() => goToQuestion(lIndex, vIndex)}
                    className={`text-sm rounded px-2 py-1 transition ${
                      beantwoord
                        ? "text-green-400 hover:bg-green-400/10"
                        : "text-gray-400 hover:bg-white/5"
                    } ${active ? "underline" : ""}`}
                  >
                    Vraag {vIndex + 1}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
