import React from "react";
import "./HomePage.css";

const HomePage: React.FC = () => {
  return (
    <main>
      <section id="home" className="hero">
        <h1>Sui Mind - AI Meets Blockchain</h1>
        <p>Revolutionizing AI Applications on the Sui Network</p>
        <a href="#features" className="cta-button">
          Explore Sui Mind
        </a>
      </section>

      <section id="combined-section" className="combined-section">
        <div id="features" className="features">
          <h2>The SUI Mind Application Stack</h2>
          <div className="grid-container">
            <div className="feature">
              <h3>Mind Search</h3>
              <p>
                Sui Mind is a sophisticated AI-powered search engine that
                leverages the Sui blockchain to deliver real-time, secure, and
                highly accurate search results tailored for you.
              </p>
            </div>
            <div className="feature">
              <h3>Mind Yield</h3>
              <p>
                Earn attractive yields by staking your tokens, providing
                liquidity to LP pools, participating in yield farms, and planned
                airdrops.
              </p>
            </div>
            <div className="feature">
              <h3>Mind Swap</h3>
              <p>
                Sui Mind integrates a token swapping platform that allows users
                to trade various tokens on the Sui blockchain. Sui Mind token
                holders ($SUI-M) enjoy reduced transaction fees, enhancing the
                affordability and convenience of asset management.
              </p>
            </div>
            <div className="feature">
              <h3>Mind Exchange</h3>
              <p>
                The AI Agent Marketplace serves as a decentralized hub for
                developers to showcase, trade, and deploy AI agents. Powered by
                smart contracts, this marketplace ensures secure transactions,
                transparent ratings, and royalties for AI creators.
              </p>
            </div>
          </div>
        </div>

        <div className="community">
          <h2>Community</h2>
          <p>Join the Sui Mind community for updates and collaboration.</p>
          <div className="social-icons">
            <a
              href="https://x.com/Sui__Mind"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
            >
              Follow us on
              <img src="/x-logo.png" alt="X Logo" className="x-logo" />
            </a>
          </div>
        </div>

        <div id="contact" className="contact">
          <h2>Contact Us</h2>
          <p>
            We'd love to hear from you. Fill out the form below to get in touch!
          </p>
          <form id="contactForm" action="contact.php" method="POST">
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              required
            />
            <textarea
              name="message"
              placeholder="Your Message"
              required
            ></textarea>
            <button type="submit">Send</button>
          </form>
          <div className="form-footer">
            <p className="timestamp">Last Updated: 2025-01-28 06:46:52 UTC</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
