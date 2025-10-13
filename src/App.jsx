import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import ScanPage from "./pages/ScanPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  const [page, setPage] = useState("landing");
  const [answers, setAnswers] = useState({});

  return (
    <div className="min-h-screen w-full">
      {page === "landing" && <LandingPage onStart={() => setPage("scan")} />}
      {page === "scan" && (
        <ScanPage
          answers={answers}
          setAnswers={setAnswers}
          onFinish={() => setPage("result")}
        />
      )}
      {page === "result" && <ResultPage answers={answers} />}
    </div>
  );
}
