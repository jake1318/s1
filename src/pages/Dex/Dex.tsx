// src/pages/Dex/Dex.tsx

import { useCurrentAccount } from "@mysten/dapp-kit";
import React from "react";
import "./Dex.css";

const Dex: React.FC = () => {
  const account = useCurrentAccount();

  return (
    <div className="dex-container">
      <div className="dex-content">
        <div className="dex-header">
          <h1>DEX Trading Platform</h1>
          <div className="status-info">
            <span className="status-badge">Coming Soon</span>
          </div>
        </div>

        <div className="feature-preview">
          <h2>Upcoming Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>Advanced Trading</h3>
              <p>Limit orders, stop losses, and advanced trading tools</p>
            </div>
            <div className="feature-card">
              <h3>Market Analysis</h3>
              <p>Real-time charts, market depth, and trading volume data</p>
            </div>
            <div className="feature-card">
              <h3>Portfolio Management</h3>
              <p>Track your positions, P&L, and trading history</p>
            </div>
            <div className="feature-card">
              <h3>Liquidity Pools</h3>
              <p>Provide liquidity and earn trading fees</p>
            </div>
          </div>
        </div>

        <div className="user-section">
          {account ? (
            <div className="connected-info">
              <p>
                Connected Wallet:{" "}
                {`${account.address.slice(0, 6)}...${account.address.slice(
                  -4
                )}`}
              </p>
              <button className="notify-button">Notify When Live</button>
            </div>
          ) : (
            <div className="connect-prompt">
              <p>Connect your wallet to get notified when we launch</p>
            </div>
          )}
        </div>

        <div className="development-info">
          <h3>Development Timeline</h3>
          <div className="timeline">
            <div className="timeline-item">
              <span className="phase">Phase 1</span>
              <p>Basic trading interface and order book implementation</p>
            </div>
            <div className="timeline-item">
              <span className="phase">Phase 2</span>
              <p>Advanced trading features and analytics</p>
            </div>
            <div className="timeline-item">
              <span className="phase">Phase 3</span>
              <p>Full DEX functionality and liquidity pools</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dex;
