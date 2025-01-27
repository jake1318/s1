import { Link } from "react-router-dom";
import React from "react";
import "./Navbar.css";

const Navbar: React.FC = () => {
  return (
    <nav>
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
    </nav>
  );
};

export default Navbar;
