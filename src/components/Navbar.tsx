import { Link } from "react-router-dom";
import React from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const account = useCurrentAccount();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
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
          <ConnectButton connectText="Connect Wallet" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
