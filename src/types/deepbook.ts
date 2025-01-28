/**
 * @file src/types/deepbook.ts
 * Updated Date: 2025-01-27 20:19:55
 * Author: jake1318
 */

export interface OrderParams {
  poolKey: string;
  price: number;
  quantity: number;
  isBid: boolean;
  clientOrderId?: string;
  orderType?: OrderType;
  selfMatchingOption?: SelfMatchingOption;
  expireTimestamp?: bigint;
  owner?: string;
}

export interface SwapParams {
  poolKey: string;
  amount: number;
  minOut: number;
  deepCoin?: string;
  slippage?: number;
}

export interface Pool {
  poolId: string;
  baseCoinKey: string;
  quoteCoinKey: string;
  baseAsset: string;
  quoteAsset: string;
  tickSize: number;
  lotSize: number;
  minSize: number;
  whitelisted: boolean;
  stablePool: boolean;
  poolType?: PoolType;
}

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
  name?: string;
}

export interface TokenBalance {
  balance: bigint;
  decimals: number;
  symbol: string;
  name?: string;
  address: string;
  formattedBalance: string;
  lastUpdated: string;
}

export interface MarketPrice {
  poolKey: string;
  price: number;
  timestamp: number;
  baseVolume24h?: number;
  quoteVolume24h?: number;
  priceChange24h?: number;
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
  numOrders?: number;
}

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  lastUpdateTime: number;
}

export interface TradeHistory {
  price: number;
  quantity: number;
  side: OrderSide;
  timestamp: number;
  orderId?: string;
  clientOrderId?: string;
}

export interface CancelOrderParams {
  poolKey: string;
  orderId: string;
  clientOrderId?: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  timestamp: number;
}

// Enums as string literal types
export type OrderType = "GTC" | "IOC" | "FOK" | "POST_ONLY";
export type SelfMatchingOption =
  | "ALLOW"
  | "ABORT"
  | "CANCEL_NEWEST"
  | "CANCEL_OLDEST";
export type OrderSide = "BUY" | "SELL";
export type OrderStatus = "OPEN" | "FILLED" | "CANCELLED" | "EXPIRED";
export type PoolType = "BASIC" | "STABLE";

// Type guard functions
export const isPool = (pool: any): pool is Pool => {
  return (
    pool &&
    typeof pool.poolId === "string" &&
    typeof pool.baseAsset === "string" &&
    typeof pool.quoteAsset === "string" &&
    typeof pool.tickSize === "number" &&
    typeof pool.lotSize === "number"
  );
};

export const isOrderParams = (params: any): params is OrderParams => {
  return (
    params &&
    typeof params.poolKey === "string" &&
    typeof params.price === "number" &&
    typeof params.quantity === "number" &&
    typeof params.isBid === "boolean"
  );
};

export const isMarketPrice = (price: any): price is MarketPrice => {
  return (
    price &&
    typeof price.poolKey === "string" &&
    typeof price.price === "number" &&
    typeof price.timestamp === "number"
  );
};

export const isTokenBalance = (balance: any): balance is TokenBalance => {
  return (
    balance &&
    typeof balance.balance === "bigint" &&
    typeof balance.decimals === "number" &&
    typeof balance.symbol === "string" &&
    typeof balance.address === "string" &&
    typeof balance.formattedBalance === "string" &&
    typeof balance.lastUpdated === "string"
  );
};

export const isOrderbookLevel = (level: any): level is OrderbookLevel => {
  return (
    level &&
    typeof level.price === "number" &&
    typeof level.quantity === "number"
  );
};

export const formatTokenBalance = (
  balance: bigint,
  decimals: number,
  symbol: string
): TokenBalance => {
  const divisor = BigInt(10 ** decimals);
  const integerPart = balance / divisor;
  const fractionalPart = balance % divisor;
  const formattedBalance = `${integerPart}.${fractionalPart
    .toString()
    .padStart(decimals, "0")}`.replace(/\.?0+$/, "");

  return {
    balance,
    decimals,
    symbol,
    address: symbol,
    formattedBalance,
    lastUpdated: new Date().toISOString(),
  };
};

export const calculatePriceImpact = (
  orderSize: number,
  marketPrice: number,
  orderBookSide: OrderbookLevel[]
): number => {
  let remainingSize = orderSize;
  let totalCost = 0;

  for (const level of orderBookSide) {
    const sizeAtLevel = Math.min(remainingSize, level.quantity);
    totalCost += sizeAtLevel * level.price;
    remainingSize -= sizeAtLevel;

    if (remainingSize <= 0) break;
  }

  const marketCost = orderSize * marketPrice;
  return ((totalCost - marketCost) / marketCost) * 100;
};
