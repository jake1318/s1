/**
 * @file Swap.tsx
 * @description Mind Swap component for decentralized token exchange
 * @author jake1318
 * @copyright Mind Protocol 2025
 * @version 1.0.0
 * @updated 2025-01-29 01:36:17
 */

import { useState, useEffect, useCallback } from "react";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { DeepBookService } from "../../services/DeepBook";
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
const DEFAULT_DECIMALS = 9;
const REFRESH_INTERVAL = 30000; // 30 seconds
const MIN_SLIPPAGE = 0.001; // 0.1%
const DEFAULT_SLIPPAGE = 0.01; // 1%

/**
 * SwapPage component handles token swapping functionality
 */
const SwapPage: React.FC = () => {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const deepBook = new DeepBookService(suiClient as any);
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

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
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE);

  // Utility functions
  const formatBalance = (balance: bigint, decimals: number): string => {
    return (Number(balance) / Math.pow(10, decimals)).toFixed(decimals);
  };

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

  // Core functionality
  const calculateEstimatedOutput = useCallback(async () => {
    if (!fromToken || !toToken || !amount || !account) return;

    try {
      const pool = findPool(fromToken.address, toToken.address);
      if (!pool) {
        setError("No liquidity pool found for this pair");
        return;
      }

      const price = await deepBook.getCurrentPrice(pool.poolId);
      if (!price) {
        throw new Error("Failed to fetch current price");
      }

      setMarketPrice({
        poolKey: pool.poolId,
        price,
        timestamp: Date.now(),
      });

      const outputAmount = parseFloat(amount) * price;
      setEstimatedOutput(outputAmount.toFixed(toToken.decimals));
    } catch (error) {
      console.error("Error calculating estimated output:", error);
      setError("Failed to calculate estimated output");
    }
  }, [fromToken, toToken, amount, account, deepBook]);

  const fetchPools = useCallback(async () => {
    setIsLoading(true);
    try {
      const poolsResponse = await deepBook.getPools();
      const poolsData: PoolWithTokens[] = [];
      const tokens = new Set<string>();

      for (const pool of poolsResponse) {
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
    } catch (error) {
      console.error("Error fetching pools:", error);
      setError("Failed to fetch pools");
    } finally {
      setIsLoading(false);
    }
  }, [deepBook]);

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
    } catch (error) {
      console.error("Error fetching token balances:", error);
      setError("Failed to fetch token balances");
    } finally {
      setIsLoadingBalances(false);
    }
  }, [account, suiClient]);

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

      // Create the transaction block
      const txb = await deepBook.createMarketSwap({
        poolId: pool.poolId,
        amount: Number(baseUnits),
        minOutput,
        baseAsset: fromToken.address,
        quoteAsset: toToken.address,
      });

      // Serialize the transaction block
      const serializedTxb = JSON.stringify(txb);

      // Sign and execute the transaction
      signAndExecuteTransaction(
        { transaction: serializedTxb },
        {
          onSuccess: (result) => {
            setAmount("");
            setEstimatedOutput("");
            Promise.all([fetchTokenBalances(), fetchPools()]);
            setError(`Swap successful! Transaction ID: ${result.digest}`);
          },
          onError: (error) => {
            console.error("Swap error:", error);
            setError("Swap failed. Please try again.");
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      console.error("Swap error:", error);
      setError("Swap failed. Please try again.");
      setIsLoading(false);
    }
  }, [
    account,
    fromToken,
    toToken,
    amount,
    estimatedOutput,
    slippage,
    deepBook,
    fetchTokenBalances,
    fetchPools,
    signAndExecuteTransaction,
  ]);

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
    if (account) {
      fetchPools();
      fetchTokenBalances();
    }
  }, [account, fetchPools, fetchTokenBalances]);

  useEffect(() => {
    if (fromToken && toToken && amount) {
      calculateEstimatedOutput();
    } else {
      setEstimatedOutput("");
      setMarketPrice(null);
    }
  }, [fromToken, toToken, amount, calculateEstimatedOutput]);

  useEffect(() => {
    if (!account) return;

    const intervalId = setInterval(() => {
      fetchPools();
      fetchTokenBalances();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [account, fetchPools, fetchTokenBalances]);

  useEffect(() => {
    if (!fromToken || !amount) return;

    const balance = tokenBalances.get(fromToken.address);
    if (!balance) return;

    if (parseFloat(amount) > parseFloat(balance.formattedBalance)) {
      setError("Insufficient balance");
    } else {
      setError(null);
    }
  }, [amount, fromToken, tokenBalances]);

  return (
    <div className="swap-container">
      <div className="swap-content">
        <div className="swap-card">
          <h1>Mind Swap</h1>

          <div className="token-section">
            <div className="token-header">
              <label>From:</label>
              <span className="balance">
                Balance:{" "}
                {fromToken ? getTokenBalance(fromToken.address) : "0.00"}
              </span>
            </div>
            <div className="input-group">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                disabled={!fromToken || !toToken}
              />
              <button
                onClick={handleMaxAmount}
                disabled={!fromToken}
                className="max-btn"
              >
                MAX
              </button>
            </div>
            <select
              className="token-select"
              value={fromToken?.address || ""}
              onChange={(e) => handleFromTokenSelect(e.target.value)}
            >
              <option value="">Select Token</option>
              {Array.from(availableTokens).map((token) => (
                <option key={token} value={token}>
                  {token.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="swap-direction-button">
            <span>↓</span>
          </div>

          <div className="token-section">
            <div className="token-header">
              <label>To:</label>
              <span className="balance">
                Balance: {toToken ? getTokenBalance(toToken.address) : "0.00"}
              </span>
            </div>
            <div className="input-group">
              <input
                type="number"
                value={estimatedOutput}
                readOnly
                placeholder="0.0"
              />
            </div>
            <select
              className="token-select"
              value={toToken?.address || ""}
              onChange={(e) => handleToTokenSelect(e.target.value)}
            >
              <option value="">Select Token</option>
              {Array.from(availableTokens).map((token) => (
                <option
                  key={token}
                  value={token}
                  disabled={token === fromToken?.address}
                >
                  {token.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          {marketPrice && (
            <div className="price-info">
              Market Price: {marketPrice.price.toFixed(6)}
            </div>
          )}

          <div className="settings-section">
            <div className="slippage-settings">
              <label>Slippage Tolerance:</label>
              <input
                type="number"
                value={slippage * 100}
                onChange={(e) =>
                  handleSlippageChange(Number(e.target.value) / 100)
                }
                step="0.1"
                min={MIN_SLIPPAGE * 100}
                max="100"
              />
              <span>%</span>
            </div>
          </div>

          <button
            className="swap-button"
            onClick={executeSwap}
            disabled={
              !account ||
              !fromToken ||
              !toToken ||
              !amount ||
              isLoading ||
              !!error
            }
          >
            {isLoading ? "Processing..." : "Swap"}
          </button>

          {error && <div className="error-message">{error}</div>}
          {isLoadingBalances && (
            <div className="loading-message">Loading balances...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
