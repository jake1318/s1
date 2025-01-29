// src/pages/Marketplace/Marketplace.tsx
import React from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import "./Marketplace.css";

const MarketplacePage: React.FC = () => {
  const account = useCurrentAccount();

  return (
    <div className="marketplace-container">
      {/* Coming Soon Banner */}
      <div className="coming-soon-banner">
        <span className="banner-text">Coming Soon</span>
      </div>

      <main>
        <section className="hero">
          <h1>Mind Exchange</h1>
          <p>
            Discover, list, and manage SUI AI Agents in our exclusive
            marketplace.
          </p>
          {account && (
            <div className="wallet-status">
              Connected:{" "}
              {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
            </div>
          )}
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
              <div className="agent-image-placeholder">
                <span>AI</span>
              </div>
              <h3>Data Miner AI</h3>
              <p>
                A powerful AI agent to extract insights from blockchain data.
              </p>
              <div className="agent-stats">
                <span>Status: Coming Soon</span>
                <span>Type: Analytics</span>
              </div>
              <button className="view-details-btn">View Details</button>
            </div>

            <div className="agent-card">
              <div className="agent-image-placeholder">
                <span>AI</span>
              </div>
              <h3>Trade Optimizer AI</h3>
              <p>
                An AI agent to optimize your SUI token trades with precision.
              </p>
              <div className="agent-stats">
                <span>Status: Coming Soon</span>
                <span>Type: Trading</span>
              </div>
              <button className="view-details-btn">View Details</button>
            </div>

            <div className="agent-card">
              <div className="agent-image-placeholder">
                <span>AI</span>
              </div>
              <h3>Smart Contract Assistant</h3>
              <p>
                An AI agent that helps in writing and deploying smart contracts.
              </p>
              <div className="agent-stats">
                <span>Status: Coming Soon</span>
                <span>Type: Development</span>
              </div>
              <button className="view-details-btn">View Details</button>
            </div>

            <div className="agent-card">
              <div className="agent-image-placeholder">
                <span>AI</span>
              </div>
              <h3>Security Auditor AI</h3>
              <p>
                Scan your smart contracts for vulnerabilities and ensure safety.
              </p>
              <div className="agent-stats">
                <span>Status: Coming Soon</span>
                <span>Type: Security</span>
              </div>
              <button className="view-details-btn">View Details</button>
            </div>
          </div>
        </section>

        <section className="marketplace-info">
          <div className="info-card">
            <h3>Marketplace Features</h3>
            <ul>
              <li>AI Agent Discovery</li>
              <li>Secure Transactions</li>
              <li>Agent Performance Metrics</li>
              <li>Custom Agent Development</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Coming Updates</h3>
            <ul>
              <li>Agent Rating System</li>
              <li>Custom Agent Requests</li>
              <li>Integration API</li>
              <li>Agent Marketplace SDK</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MarketplacePage;
