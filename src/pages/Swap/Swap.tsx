/**
 * @file src/pages/Swap/Swap.tsx
 * Updated Date: 2025-01-27 21:11:56
 * Author: jake1318
 */

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  SuiClient,
  PaginatedObjectsResponse,
  SuiTransactionBlockResponse,
} from "@mysten/sui.js/client";
import { DeepBookService, DEEPBOOK_PACKAGE_ID } from "../../services/deepbook";
import "./Swap.css";

// Types
interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

interface TokenBalance {
  address: string;
  balance: bigint;
  formattedBalance: string;
}

interface MarketPrice {
  poolKey: string;
  price: number;
  timestamp: number;
}

interface Pool {
  poolId: string;
  baseAsset: string;
  quoteAsset: string;
  tickSize: number;
  lotSize: number;
  minSize: number;
}

interface PoolWithTokens extends Pool {
  baseTokenSymbol?: string;
  quoteTokenSymbol?: string;
}

// Constants
const CUSTODIAN_ID =
  process.env.VITE_CUSTODIAN_ID ||
  "0x38fe43dd9aaff19d475ddb5f6d4657243b1428bbdf0ff797bdc1dac69986c093";
const DEFAULT_DECIMALS = 9;
const REFRESH_INTERVAL = 30000; // 30 seconds
const MIN_SLIPPAGE = 0.001; // 0.1%
const DEFAULT_SLIPPAGE = 0.01; // 1%

const Swap: React.FC = () => {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const deepBook = new DeepBookService(suiClient);

  // State management
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [pools, setPools] = useState<PoolWithTokens[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string>("");
  const [availableTokens, setAvailableTokens] = useState<Set<string>>(
    new Set()
  );
  const [tokenBalances, setTokenBalances] = useState<Map<string, TokenBalance>>(
    new Map()
  );
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>(
    new Date().toISOString().replace("T", " ").split(".")[0]
  );
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);

  // Utility functions
  const updateLastRefresh = useCallback(() => {
    setLastRefresh(new Date().toISOString().replace("T", " ").split(".")[0]);
  }, []);

  const formatBalance = (balance: bigint, decimals: number): string => {
    return (Number(balance) / Math.pow(10, decimals)).toFixed(decimals);
  };
  // Data fetching and core functionality
  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    try {
      const pools = await deepBook.getPools();
      const poolsData: PoolWithTokens[] = [];
      const tokens = new Set<string>();

      for (const pool of pools.data) {
        if (!pool.data?.content) continue;

        const content = pool.data.content as any;
        const poolData: PoolWithTokens = {
          poolId: pool.data.objectId,
          baseAsset: content.fields.base_asset,
          quoteAsset: content.fields.quote_asset,
          tickSize: Number(content.fields.tick_size || 0),
          lotSize: Number(content.fields.lot_size || 0),
          minSize: Number(content.fields.min_size || 0),
          baseTokenSymbol: content.fields.base_asset.slice(0, 8),
          quoteTokenSymbol: content.fields.quote_asset.slice(0, 8),
        };

        tokens.add(poolData.baseAsset);
        tokens.add(poolData.quoteAsset);
        poolsData.push(poolData);
      }

      setAvailableTokens(tokens);
      setPools(poolsData);
      updateLastRefresh();
    } catch (error) {
      console.error("Error fetching pools:", error);
      setError("Failed to fetch pools");
    } finally {
      setIsLoading(false);
    }
  }, [deepBook, updateLastRefresh]);

  const fetchTokenBalances = useCallback(async () => {
    if (!account) return;

    setIsLoadingBalances(true);
    try {
      const { data: coins } = await suiClient.getCoins({
        owner: account.address,
      });

      const newBalances = new Map<string, TokenBalance>();

      for (const coin of coins) {
        const formattedBalance = formatBalance(
          BigInt(coin.balance),
          DEFAULT_DECIMALS
        );
        newBalances.set(coin.coinType, {
          address: coin.coinType,
          balance: BigInt(coin.balance),
          formattedBalance,
        });
      }

      setTokenBalances(newBalances);
      updateLastRefresh();
    } catch (error) {
      console.error("Error fetching token balances:", error);
      setError("Failed to fetch token balances");
    } finally {
      setIsLoadingBalances(false);
    }
  }, [account, suiClient, updateLastRefresh]);

  const executeSwap = useCallback(async () => {
    if (!account || !fromToken || !toToken || !amount) {
      setError("Please fill in all fields and connect wallet");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pool = findPool(fromToken.address, toToken.address);
      if (!pool) {
        throw new Error("No liquidity pool found for this pair");
      }

      const baseUnits = BigInt(
        Math.floor(parseFloat(amount) * Math.pow(10, fromToken.decimals))
      );

      const minOutput = estimatedOutput
        ? Math.floor(parseFloat(estimatedOutput) * (1 - slippage))
        : 0;

      const tx = await deepBook.createMarketSwap({
        poolId: pool.poolId,
        amount: Number(baseUnits),
        minOutput,
        baseAsset: fromToken.address,
        quoteAsset: toToken.address,
      });

      const result = await suiClient.executeTransactionBlock({
        transactionBlock: tx,
        requestType: "WaitForLocalExecution",
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
        },
      });

      setAmount("");
      setEstimatedOutput("");
      await Promise.all([fetchTokenBalances(), fetchPools()]);

      setError(`Swap successful! Transaction ID: ${result.digest}`);
    } catch (error) {
      console.error("Swap error:", error);
      setError("Swap failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    account,
    fromToken,
    toToken,
    amount,
    estimatedOutput,
    slippage,
    suiClient,
    deepBook,
    fetchTokenBalances,
    fetchPools,
  ]);

  // Helper functions
  const findPool = useCallback(
    (baseAsset: string, quoteAsset: string): PoolWithTokens | undefined => {
      return pools.find(
        (pool) =>
          (pool.baseAsset === baseAsset && pool.quoteAsset === quoteAsset) ||
          (pool.baseAsset === quoteAsset && pool.quoteAsset === baseAsset)
      );
    },
    [pools]
  );

  const getTokenBalance = useCallback(
    (tokenAddress: string): string => {
      const balance = tokenBalances.get(tokenAddress);
      return balance ? balance.formattedBalance : "0";
    },
    [tokenBalances]
  );

  // Event handlers
  const handleFromTokenSelect = useCallback((address: string) => {
    if (!address) {
      setFromToken(null);
      return;
    }

    setFromToken({
      symbol: address.slice(0, 8),
      address,
      decimals: DEFAULT_DECIMALS,
    });
    setError(null);
  }, []);

  const handleToTokenSelect = useCallback((address: string) => {
    if (!address) {
      setToToken(null);
      return;
    }

    setToToken({
      symbol: address.slice(0, 8),
      address,
      decimals: DEFAULT_DECIMALS,
    });
    setError(null);
  }, []);

  const handleMaxAmount = useCallback(() => {
    if (!fromToken) return;
    const balance = tokenBalances.get(fromToken.address);
    if (balance) {
      setAmount(balance.formattedBalance);
    }
  }, [fromToken, tokenBalances]);

  const handleSlippageChange = useCallback((value: number) => {
    setSlippage(Math.max(MIN_SLIPPAGE, Math.min(value, 1)));
  }, []);

  // Effects
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  useEffect(() => {
    if (fromToken && toToken && amount) {
      calculateEstimatedOutput();
    }
  }, [fromToken, toToken, amount, calculateEstimatedOutput]);

  useEffect(() => {
    if (account && availableTokens.size > 0) {
      fetchTokenBalances();
    }
  }, [account, availableTokens.size, fetchTokenBalances]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (fromToken && toToken) {
        calculateEstimatedOutput();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fromToken, toToken, calculateEstimatedOutput]);

  // Render
  return (
    <div className="swap-container">
      <div className="swap-box">
        <h2>Swap Tokens</h2>

        {error && (
          <div
            className={`message ${
              error.includes("successful") ? "success" : "error"
            }`}
          >
            {error}
          </div>
        )}

        <div className="last-update">Last updated: {lastRefresh} UTC</div>

        {!account ? (
          <div className="connect-message">
            Please connect your wallet to continue
          </div>
        ) : (
          <>
            <div className="wallet-info">
              <div>
                Connected:{" "}
                {`${account.address.slice(0, 6)}...${account.address.slice(
                  -4
                )}`}
              </div>
              {isLoadingBalances && (
                <div className="loading-balances">Loading balances...</div>
              )}
            </div>

            <div className="slippage-settings">
              <label>Slippage Tolerance:</label>
              <select
                value={slippage}
                onChange={(e) =>
                  handleSlippageChange(parseFloat(e.target.value))
                }
                disabled={isLoading}
              >
                <option value={0.001}>0.1%</option>
                <option value={0.005}>0.5%</option>
                <option value={0.01}>1.0%</option>
                <option value={0.02}>2.0%</option>
              </select>
            </div>

            <div className="token-input">
              <div className="token-select-header">
                <label>From</label>
                {fromToken && (
                  <div className="token-balance">
                    Balance: {getTokenBalance(fromToken.address)}{" "}
                    {fromToken.symbol}
                  </div>
                )}
              </div>
              <select
                value={fromToken?.address || ""}
                onChange={(e) => handleFromTokenSelect(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select token</option>
                {Array.from(availableTokens).map((tokenAddress) => (
                  <option key={tokenAddress} value={tokenAddress}>
                    {tokenAddress.slice(0, 8)}
                    {tokenBalances.get(tokenAddress)
                      ? ` (${
                          tokenBalances.get(tokenAddress)?.formattedBalance
                        })`
                      : ""}
                  </option>
                ))}
              </select>
              <div className="input-with-max">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  disabled={isLoading}
                  min="0"
                  step="0.000000001"
                />
                {fromToken && (
                  <button
                    className="max-button"
                    onClick={handleMaxAmount}
                    disabled={isLoading}
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            <div className="swap-arrow">↓</div>

            <div className="token-input">
              <div className="token-select-header">
                <label>To</label>
                {toToken && (
                  <div className="token-balance">
                    Balance: {getTokenBalance(toToken.address)} {toToken.symbol}
                  </div>
                )}
              </div>
              <select
                value={toToken?.address || ""}
                onChange={(e) => handleToTokenSelect(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Select token</option>
                {Array.from(availableTokens).map((tokenAddress) => (
                  <option key={tokenAddress} value={tokenAddress}>
                    {tokenAddress.slice(0, 8)}
                    {tokenBalances.get(tokenAddress)
                      ? ` (${
                          tokenBalances.get(tokenAddress)?.formattedBalance
                        })`
                      : ""}
                  </option>
                ))}
              </select>
              {estimatedOutput && (
                <div className="estimated-output">
                  Estimated output: {estimatedOutput} {toToken?.symbol}
                </div>
              )}
            </div>

            {marketPrice && (
              <div className="market-info">
                <div>Market Price: {marketPrice.price.toFixed(6)}</div>
                <div>
                  Last Updated:{" "}
                  {new Date(marketPrice.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}

            <button
              className="swap-button"
              onClick={executeSwap}
              disabled={
                isLoading ||
                !fromToken ||
                !toToken ||
                !amount ||
                (fromToken &&
                  parseFloat(amount) >
                    parseFloat(getTokenBalance(fromToken.address)))
              }
            >
              {isLoading
                ? "Processing..."
                : !amount
                ? "Enter amount"
                : fromToken &&
                  parseFloat(amount) >
                    parseFloat(getTokenBalance(fromToken.address))
                ? "Insufficient balance"
                : "Swap"}
            </button>

            <button
              onClick={fetchTokenBalances}
              className="refresh-button"
              disabled={isLoadingBalances}
            >
              {isLoadingBalances ? "Refreshing..." : "Refresh Balances"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Swap;
