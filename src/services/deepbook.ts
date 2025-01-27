/**
 * @file src/services/deepbook.ts
 * Updated Date: 2025-01-27 05:50:40
 * Author: jake1318
 */

import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient, SuiObjectResponse } from "@mysten/sui.js/client";
import {
  OrderParams,
  SwapParams,
  Pool,
  OrderType,
  SelfMatchingOption,
  CancelOrderParams,
  QueryOrderParams,
  ApiResponse,
  MarketPrice,
  Orderbook,
} from "../types/deepbook";

export const DEEPBOOK_PACKAGE_ID = process.env.VITE_DEEPBOOK_PACKAGE_ID || 
  "0x000000000000000000000000000000000000000000000000000000000000dee9";
export const CLOB_V2_MODULE = "clob_v2";
export const DEFAULT_EXPIRE_TIMESTAMP = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24 hours

export class DeepBookService {
  constructor(private suiClient: SuiClient) {}

  async createLimitOrder(params: OrderParams): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const orderArguments = [
      tx.pure(params.poolKey),
      tx.pure(params.price),
      tx.pure(params.quantity),
      tx.pure(params.isBid),
      tx.pure(params.clientOrderId),
    ];

    // Add optional parameters if provided
    if (params.orderType) {
      orderArguments.push(tx.pure(params.orderType));
    }
    if (params.selfMatchingOption) {
      orderArguments.push(tx.pure(params.selfMatchingOption));
    }
    if (params.expireTimestamp) {
      orderArguments.push(tx.pure(params.expireTimestamp));
    } else {
      orderArguments.push(tx.pure(DEFAULT_EXPIRE_TIMESTAMP));
    }

    tx.moveCall({
      target: `${DEEPBOOK_PACKAGE_ID}::${CLOB_V2_MODULE}::place_limit_order`,
      arguments: orderArguments,
    });

    return tx;
  }

  async createMarketOrder(params: SwapParams): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const swapArguments = [
      tx.pure(params.poolKey),
      tx.pure(params.amount),
      tx.pure(params.minOut),
    ];

    if (params.deepCoin) {
      swapArguments.push(tx.pure(params.deepCoin));
    }

    tx.moveCall({
      target: `${DEEPBOOK_PACKAGE_ID}::${CLOB_V2_MODULE}::swap_exact_quote_for_base`,
      arguments: swapArguments,
    });

    return tx;
  }

  async cancelOrder(params: CancelOrderParams): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${DEEPBOOK_PACKAGE_ID}::${CLOB_V2_MODULE}::cancel_order`,
      arguments: [
        tx.pure(params.poolKey),
        tx.pure(params.orderId),
        params.clientOrderId ? tx.pure(params.clientOrderId) : tx.pure(""),
      ],
    });

    return tx;
  }

  async getPoolLiquidity(poolKey: string): Promise<ApiResponse<Pool>> {
    try {
      const poolData = await this.suiClient.getObject({
        id: poolKey,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!poolData.data) {
        throw new Error("Pool not found");
      }

      return {
        success: true,
        data: this.parsePoolData(poolData),
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 404,
          message: error instanceof Error ? error.message : "Failed to fetch pool data",
        },
        timestamp: Date.now(),
      };
    }
  }

  async getOrderbook(poolKey: string): Promise<ApiResponse<Orderbook>> {
    try {
      const orderbook = await this.suiClient.getDynamicFields({
        parentId: poolKey,
      });

      return {
        success: true,
        data: {
          bids: this.parseOrderbookSide(orderbook.data, true),
          asks: this.parseOrderbookSide(orderbook.data, false),
          lastUpdateTime: Date.now(),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Failed to fetch orderbook",
        },
        timestamp: Date.now(),
      };
    }
  }

  async getMarketPrice(poolKey: string): Promise<ApiResponse<MarketPrice>> {
    try {
      const price = await this.suiClient.getDynamicFieldObject({
        parentId: poolKey,
        name: {
          type: "u64",
          value: "price",
        },
      });

      return {
        success: true,
        data: {
          poolKey,
          price: this.parsePrice(price),
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 500,
          message: error instanceof Error ? error.message : "Failed to fetch market price",
        },
        timestamp: Date.now(),
      };
    }
  }

  private calculateMinimumReceived(amount: number, slippage: number = 0.01): number {
    return amount * (1 - slippage);
  }

  private parsePoolData(poolData: SuiObjectResponse): Pool {
    // Implementation depends on the exact structure of your pool data
    const content = poolData.data?.content as any;
    return {
      poolId: poolData.data?.objectId || "",
      baseCoinKey: content?.base_asset || "",
      quoteCoinKey: content?.quote_asset || "",
      baseAsset: content?.base_asset || "",
      quoteAsset: content?.quote_asset || "",
      tickSize: parseFloat(content?.tick_size || "0"),
      lotSize: parseFloat(content?.lot_size || "0"),
      minSize: parseFloat(content?.min_size || "0"),
      whitelisted: content?.whitelisted || false,
      stablePool: content?.stable_pool || false,
    };
  }

  private parseOrderbookSide(data: any[], isBid: boolean): { price: number; quantity: number }[] {
    // Implementation depends on your orderbook data structure
    return [];
  }

  private parsePrice(priceData: any): number {
    // Implementation depends on your price data structure
    return 0;
  }
}