import { Link } from "react-router-dom";
import React from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const account = useCurrentAccount();

  return (
    <nav className="navbar">
      {/* Logo Section */}
      <div className="navbar-logo">
        <Link to="/" className="logo-container">
          <img src="/Design_2.png" alt="Sui Mind Logo" className="logo-image" />
          <span className="logo-text">Sui Mind</span>
        </Link>
      </div>

      {/* Navigation Links Section */}
      <div className="navbar-center">
        <ul>
          <li>
            <Link to="/search">Search</Link>
          </li>
          <li>
            <Link to="/swap">Swap</Link>
          </li>
          <li>
            <Link to="/dex">DEX</Link>
          </li>
          <li>
            <Link to="/marketplace">Marketplace</Link>
          </li>
        </ul>
      </div>

      {/* Wallet Section */}
      <div className="navbar-right">
        <div className="wallet-section">
          {account && (
            <div className="wallet-info">
              <span className="wallet-address" title={account.address}>
                {`${account.address.slice(0, 6)}...${account.address.slice(
                  -4
                )}`}
              </span>
            </div>
          )}
          <ConnectButton
            className="connect-wallet-button"
            connectText="Connect Wallet"
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
