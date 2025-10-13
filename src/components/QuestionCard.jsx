export default function QuestionCard({ vraag, antwoord, onAnswer, onNext }) {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 max-w-xl w-full text-center border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">{vraag}</h2>
      <div className="flex justify-center gap-3 mb-8">
        {[1,2,3,4,5].map(score => (
          <button
            key={score}
            onClick={() => onAnswer(score)}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              antwoord?.score === score
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <button
        onClick={onNext}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        Volgende ➡️
      </button>
    </div>
  );
}
