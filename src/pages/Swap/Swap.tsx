/**
 * @file src/pages/Swap/Swap.tsx
 * Updated Date: 2025-01-27 05:52:12
 * Author: jake1318
 */

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiEventFilter } from "@mysten/sui.js/client";
import { DeepBookService } from "../../services/deepbook";
import {
  Pool,
  TokenBalance,
  TokenInfo,
  SwapParams,
  ApiResponse,
  MarketPrice,
} from "../../types/deepbook";
import "./Swap.css";

// Constants
const DEEPBOOK_PACKAGE_ID =
  process.env.VITE_DEEPBOOK_PACKAGE_ID ||
  "0xdee9000000000000000000000000000000000000000000000000000000000000";
const CUSTODIAN_ID =
  process.env.VITE_CUSTODIAN_ID ||
  "0x38fe43dd9aaff19d475ddb5f6d4657243b1428bbdf0ff797bdc1dac69986c093";
const DEFAULT_DECIMALS = 9;
const REFRESH_INTERVAL = 30000; // 30 seconds

interface PoolWithTokens extends Pool {
  baseTokenSymbol?: string;
  quoteTokenSymbol?: string;
}

const Swap: React.FC = () => {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
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

  // Utility functions
  const formatBalance = useCallback(
    (balance: bigint, decimals: number): string => {
      const divisor = BigInt(10 ** decimals);
      const integerPart = balance / divisor;
      const fractionalPart = balance % divisor;
      const paddedFractionalPart = fractionalPart
        .toString()
        .padStart(decimals, "0");
      return `${integerPart}.${paddedFractionalPart}`.replace(/\.?0+$/, "");
    },
    []
  );

  const updateLastRefresh = useCallback(() => {
    setLastRefresh(new Date().toISOString().replace("T", " ").split(".")[0]);
  }, []);

  // Data fetching functions
  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter: SuiEventFilter = {
        MoveEventType: `${DEEPBOOK_PACKAGE_ID}::clob_v2::PoolCreated`,
      };

      const events = await suiClient.queryEvents({ query: filter });
      const tokens = new Set<string>();
      const poolsData: PoolWithTokens[] = [];

      for (const event of events.data) {
        const parsedEvent = event.parsedJson as any;
        const pool: PoolWithTokens = {
          poolId: parsedEvent.poolId,
          baseAsset: parsedEvent.baseAsset,
          quoteAsset: parsedEvent.quoteAsset,
          tickSize: Number(parsedEvent.tickSize),
          lotSize: Number(parsedEvent.lotSize),
          minSize: Number(parsedEvent.minSize || 0),
          whitelisted: Boolean(parsedEvent.whitelisted),
          stablePool: Boolean(parsedEvent.stablePool),
          baseTokenSymbol: parsedEvent.baseAsset.slice(0, 8),
          quoteTokenSymbol: parsedEvent.quoteAsset.slice(0, 8),
        };

        tokens.add(pool.baseAsset);
        tokens.add(pool.quoteAsset);
        poolsData.push(pool);
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
  }, [suiClient]);

  const fetchTokenBalances = useCallback(async () => {
    if (!account) return;

    setIsLoadingBalances(true);
    try {
      const { data: ownedObjects } = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: { StructType: "0x2::coin::Coin" },
        options: { showType: true, showContent: true },
      });

      const newBalances = new Map<string, TokenBalance>();

      for (const obj of ownedObjects) {
        if (!obj.data?.type || !obj.data?.content) continue;

        const tokenType = obj.data.type.split("<")[1].replace(">", "");
        const balance = BigInt(obj.data.content.fields.balance || "0");
        const existingBalance =
          newBalances.get(tokenType)?.balance || BigInt(0);

        newBalances.set(tokenType, {
          address: tokenType,
          symbol: tokenType.slice(0, 8),
          balance: existingBalance + balance,
          decimals: DEFAULT_DECIMALS,
          formattedBalance: formatBalance(
            existingBalance + balance,
            DEFAULT_DECIMALS
          ),
          lastUpdated: new Date().toISOString(),
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
  }, [account, suiClient, formatBalance]);

  // ... [Continuing from previous part]

  // Price and swap calculations
  const calculateEstimatedOutput = useCallback(async () => {
    if (!fromToken || !toToken || !amount || !account) return;

    try {
      const pool = findPool(fromToken.address, toToken.address);
      if (!pool) {
        setError("No liquidity pool found for this pair");
        return;
      }

      const priceResponse = await deepBook.getMarketPrice(pool.poolId);
      if (!priceResponse.success) {
        throw new Error(
          priceResponse.error?.message || "Failed to fetch price"
        );
      }

      setMarketPrice(priceResponse.data);
      const outputAmount = parseFloat(amount) * priceResponse.data.price;
      setEstimatedOutput(outputAmount.toFixed(toToken.decimals));
    } catch (error) {
      console.error("Error calculating estimated output:", error);
      setError("Failed to calculate estimated output");
    }
  }, [fromToken, toToken, amount, account, deepBook]);

  const executeSwap = useCallback(async () => {
    if (!account || !fromToken || !toToken || !amount) {
      setError("Please fill in all fields and connect wallet");
      return;
    }

    const balance = parseFloat(getTokenBalance(fromToken.address));
    if (parseFloat(amount) > balance) {
      setError("Insufficient balance");
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

      const swapParams: SwapParams = {
        poolKey: pool.poolId,
        amount: Number(baseUnits),
        deepAmount: 0,
        minOut: 0, // TODO: Add slippage protection
        deepCoin: CUSTODIAN_ID,
      };

      const tx = await deepBook.createMarketOrder(swapParams);

      const result = await suiClient.signAndExecuteTransactionBlock({
        signer: account,
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
        },
      });

      console.log("Swap executed:", result);

      // Reset form and refresh data
      setAmount("");
      setEstimatedOutput("");
      await Promise.all([fetchTokenBalances(), fetchPools()]);

      // Show success message
      const successMessage = `Swap successful! Transaction ID: ${result.digest.slice(
        0,
        8
      )}...${result.digest.slice(-6)}`;
      setError(successMessage);
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
    suiClient,
    deepBook,
    fetchTokenBalances,
    fetchPools,
  ]);

  // Helper functions
  const findPool = useCallback(
    (baseAsset: string, quoteAsset: string): Pool | undefined => {
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

  // Auto-refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (fromToken && toToken) {
        calculateEstimatedOutput();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fromToken, toToken, calculateEstimatedOutput]);

  // Render component
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
                parseFloat(amount) >
                  parseFloat(getTokenBalance(fromToken.address))
              }
            >
              {isLoading
                ? "Processing..."
                : !amount
                ? "Enter amount"
                : parseFloat(amount) >
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
