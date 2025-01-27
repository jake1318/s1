import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/Home/HomePage";
import SearchPage from "./pages/Search/SearchPage";
import SwapPage from "./pages/Swap/SwapPage";
import DexPage from "./pages/Dex/DexPage";
import MarketplacePage from "./pages/Marketplace/MarketplacePage";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        {/* Navbar */}
        <Navbar />

        {/* Main Routes */}
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/dex" element={<DexPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
