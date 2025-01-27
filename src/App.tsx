// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import HomePage from "./pages/Home/HomePage";
import SearchPage from "./pages/Search/Search";
import SwapPage from "./pages/Swap/Swap";
import DexPage from "./pages/Dex/Dex";
import MarketplacePage from "./pages/Marketplace/Marketplace";

import "./App.css";

// Create network configuration
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl("mainnet") },
  // Add testnet if needed
  // testnet: { url: getFullnodeUrl('testnet') },
});

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          <Router>
            <div className="app-container">
              {/* Navbar */}
              <Navbar />

              {/* Main Content */}
              <div className="main-content">
                <Routes>
                  {/* Route for the HomePage */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/swap" element={<SwapPage />} />
                  <Route path="/dex" element={<DexPage />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                </Routes>
              </div>

              {/* Footer */}
              <Footer />
            </div>
          </Router>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};

export default App;
