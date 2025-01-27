/**
 * @file src/types/deepbook.ts
 * Updated Date: 2025-01-27 05:47:51
 * Author: jake1318
 */

import { SuiObjectResponse } from '@mysten/sui.js/client';

export interface OrderParams {
    poolKey: string;
    balanceManagerKey: string;
    clientOrderId: string;
    price: number;
    quantity: number;
    isBid: boolean;
    orderType?: 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
    selfMatchingOption?: 'ALLOW' | 'ABORT' | 'CANCEL_NEWEST' | 'CANCEL_OLDEST';
    payWithDeep?: boolean;
    owner?: string;
    expireTimestamp?: number;
}

export interface SwapParams {
    poolKey: string;
    amount: number;
    deepAmount: number;
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
    poolType?: 'BASIC' | 'STABLE';
}

export interface PoolEvent {
    id: string;
    packageId: string;
    transactionModule: string;
    type: string;
    parsedJson: {
        poolId: string;
        baseAsset: string;
        quoteAsset: string;
        tickSize: string;
        lotSize: string;
        minSize: string;
        whitelisted?: boolean;
        stablePool?: boolean;
    };
}

export interface TokenBalance {
    balance: bigint;
    decimals: number;
    symbol?: string;
    name?: string;
}

export interface OrderStatus {
    orderId: string;
    clientOrderId: string;
    price: number;
    quantity: number;
    isBid: boolean;
    orderType: string;
    status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
    filledQuantity: number;
    filledPrice?: number;
    timestamp: number;
}

export interface MarketPrice {
    poolKey: string;
    price: number;
    timestamp: number;
    baseVolume24h?: number;
    quoteVolume24h?: number;
    priceChange24h?: number;
}

export interface DeepBookConfig {
    packageId: string;
    moduleId: string;
    env: 'mainnet' | 'testnet' | 'devnet';
    rpcUrl?: string;
}

export interface BalanceManager {
    address: string;
    tradeCap: string;
    balances?: {
        [key: string]: TokenBalance;
    };
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
    side: 'BUY' | 'SELL';
    timestamp: number;
    orderId?: string;
    clientOrderId?: string;
}

export type OrderType = 'GTC' | 'IOC' | 'FOK' | 'POST_ONLY';
export type SelfMatchingOption = 'ALLOW' | 'ABORT' | 'CANCEL_NEWEST' | 'CANCEL_OLDEST';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED';

export interface CancelOrderParams {
    poolKey: string;
    orderId: string;
    clientOrderId?: string;
}

export interface QueryOrderParams {
    poolKey?: string;
    orderId?: string;
    clientOrderId?: string;
    status?: OrderStatus;
    startTime?: number;
    endTime?: number;
    limit?: number;
}

export interface ErrorResponse {
    code: number;
    message: string;
    details?: any;
}

// Utility type for handling API responses
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ErrorResponse;
    timestamp: number;
}

// Type guard functions
export const isPoolEvent = (event: any): event is PoolEvent => {
    return (
        event &&
        event.parsedJson &&
        typeof event.parsedJson.poolId === 'string' &&
        typeof event.parsedJson.baseAsset === 'string' &&
        typeof event.parsedJson.quoteAsset === 'string'
    );
};

export const isOrderParams = (params: any): params is OrderParams => {
    return (
        params &&
        typeof params.poolKey === 'string' &&
        typeof params.price === 'number' &&
        typeof params.quantity === 'number' &&
        typeof params.isBid === 'boolean'
    );
};

export const isPool = (pool: any): pool is Pool => {
    return (
        pool &&
        typeof pool.poolId === 'string' &&
        typeof pool.baseAsset === 'string' &&
        typeof pool.quoteAsset === 'string' &&
        typeof pool.tickSize === 'number' &&
        typeof pool.lotSize === 'number'
    );
};