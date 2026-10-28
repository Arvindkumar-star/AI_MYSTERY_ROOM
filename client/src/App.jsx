import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { History, Shield, Sparkles } from 'lucide-react';

import LandingPage from './pages/LandingPage.jsx';
import GeneratingPage from './pages/GeneratingPage.jsx';
import BriefingPage from './pages/BriefingPage.jsx';
import InvestigationPage from './pages/InvestigationPage.jsx';
import VerdictPage from './pages/VerdictPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-noir-950 text-paper-100 selection:bg-amber-dim selection:text-paper-50 font-sans">
        {/* Navigation Bar */}
        <header className="border-b border-noir-800 bg-noir-900/90 backdrop-blur sticky top-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="w-8 h-8 rounded bg-amber/20 border border-amber/40 flex items-center justify-center text-amber font-serif font-bold group-hover:bg-amber/30 transition shadow">
              M
            </span>
            <div>
              <h1 className="font-serif text-base sm:text-lg tracking-wide text-paper-50 font-bold leading-tight group-hover:text-amber transition">
                AI MYSTERY ROOM
              </h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                Deductive Investigation Bureau
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-xs font-mono">
            <Link
              to="/history"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-paper-100 transition px-2.5 py-1.5 rounded hover:bg-noir-800"
            >
              <History className="w-3.5 h-3.5 text-amber" />
              <span>Archive</span>
            </Link>
          </nav>
        </header>

        {/* Page Views */}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/case/:id/generating" element={<GeneratingPage />} />
            <Route path="/case/:id" element={<BriefingPage />} />
            <Route path="/investigation/:id" element={<InvestigationPage />} />
            <Route path="/investigation/:id/verdict" element={<VerdictPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>

        {/* Legal & Privacy Disclaimer Footer (Section 14.4) */}
        <footer className="border-t border-noir-800/80 py-3 px-6 text-center text-[11px] text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Mystery Room — All crimes, characters, and evidence are AI-generated fiction.</span>
          <span>Solvable through pure logic & deduction.</span>
        </footer>
      </div>
    </Router>
  );
}
