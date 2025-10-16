import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ScanPage from "./pages/ScanPage";
import ResultPage from "./pages/ResultPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/scan" element={<ScanPage />} />
      <Route path="/results" element={<ResultPage />} />
    </Routes>
  );
}