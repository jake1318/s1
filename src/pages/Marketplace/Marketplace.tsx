import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Marketplace.css";

const MarketplacePage: React.FC = () => {
  const connectWallet = () => {
    alert("Wallet connection functionality coming soon!");
  };

  return (
    <div>
      {/* Coming Soon Banner */}
      <div className="coming-soon-banner">Coming Soon</div>

      <Navbar />

      <main>
        <section className="hero">
          <h1>Mind Exchange</h1>
          <p>
            Discover, list, and manage SUI AI Agents in our exclusive
            marketplace.
          </p>
        </section>

        <section className="agent-marketplace">
          <h2>Explore SUI AI Agents</h2>
          <p>
            Browse through available AI agents that can enhance your SUI
            ecosystem experience.
          </p>

          <div className="agent-grid">
            {/* Sample Agent Card */}
            <div className="agent-card">
              <img src="agent1.png" alt="Agent Icon" />
              <h3>Data Miner AI</h3>
              <p>
                A powerful AI agent to extract insights from blockchain data.
              </p>
              <button>View Details</button>
            </div>

            <div className="agent-card">
              <img src="agent2.png" alt="Agent Icon" />
              <h3>Trade Optimizer AI</h3>
              <p>
                An AI agent to optimize your SUI token trades with precision.
              </p>
              <button>View Details</button>
            </div>

            <div className="agent-card">
              <img src="agent3.png" alt="Agent Icon" />
              <h3>Smart Contract Assistant</h3>
              <p>
                An AI agent that helps in writing and deploying smart contracts.
              </p>
              <button>View Details</button>
            </div>

            <div className="agent-card">
              <img src="agent4.png" alt="Agent Icon" />
              <h3>Security Auditor AI</h3>
              <p>
                Scan your smart contracts for vulnerabilities and ensure safety.
              </p>
              <button>View Details</button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MarketplacePage;
