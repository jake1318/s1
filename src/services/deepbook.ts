/**
 * @file src/services/deepbook.ts
 * Updated Date: 2025-01-27 21:03:35
 * Author: jake1318
 */

import { TransactionBlock } from "@mysten/sui.js/transactions";
import {
  SuiClient,
  SuiEventFilter,
  PaginatedObjectsResponse,
} from "@mysten/sui.js/client";

export interface PoolState {
  type: string;
  baseAsset: string;
  quoteAsset: string;
  baseBalance: bigint;
  quoteBalance: bigint;
  lpSupply: bigint;
  baseScale: number;
  quoteScale: number;
}

export interface CreateOrderParams {
  poolId: string;
  price: number;
  quantity: number;
  isBid: boolean;
  baseAsset: string;
  quoteAsset: string;
}

export interface SwapParams {
  poolId: string;
  amount: number;
  minOutput: number;
  baseAsset: string;
  quoteAsset: string;
}

export const DEEPBOOK_PACKAGE_ID =
  process.env.VITE_DEEPBOOK_PACKAGE_ID ||
  "0x000000000000000000000000000000000000000000000000000000000000dee9";

export class DeepBookService {
  private readonly moduleAddress: string;

  constructor(
    private readonly suiClient: SuiClient,
    packageId: string = DEEPBOOK_PACKAGE_ID
  ) {
    this.moduleAddress = packageId;
  }

  /**
   * Create a transaction for placing a limit order
   */
  async createLimitOrder({
    poolId,
    price,
    quantity,
    isBid,
    baseAsset,
    quoteAsset,
  }: CreateOrderParams): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const [pool] = tx.moveCall({
      target: `${this.moduleAddress}::clob_v2::create_limit_order`,
      arguments: [
        tx.pure(poolId),
        tx.pure(price),
        tx.pure(quantity),
        tx.pure(isBid),
        tx.pure(baseAsset),
        tx.pure(quoteAsset),
      ],
    });

    return tx;
  }

  /**
   * Create a transaction for market swap
   */
  async createMarketSwap({
    poolId,
    amount,
    minOutput,
    baseAsset,
    quoteAsset,
  }: SwapParams): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const [pool] = tx.moveCall({
      target: `${this.moduleAddress}::clob_v2::swap_exact_base_for_quote`,
      arguments: [
        tx.pure(poolId),
        tx.pure(amount),
        tx.pure(minOutput),
        tx.pure(baseAsset),
        tx.pure(quoteAsset),
      ],
    });

    return tx;
  }

  /**
   * Get pool state
   */
  async getPoolState(poolId: string): Promise<PoolState | null> {
    try {
      const response = await this.suiClient.getObject({
        id: poolId,
        options: {
          showContent: true,
        },
      });

      if (!response.data || !response.data.content) {
        return null;
      }

      const content = response.data.content as any;
      const fields = content.fields;

      return {
        type: content.type,
        baseAsset: fields.base_asset,
        quoteAsset: fields.quote_asset,
        baseBalance: BigInt(fields.base_balance),
        quoteBalance: BigInt(fields.quote_balance),
        lpSupply: BigInt(fields.lp_supply),
        baseScale: Number(fields.base_scale),
        quoteScale: Number(fields.quote_scale),
      };
    } catch (error) {
      console.error("Error fetching pool state:", error);
      return null;
    }
  }

  /**
   * Get current price from pool
   */
  async getCurrentPrice(poolId: string): Promise<number | null> {
    const state = await this.getPoolState(poolId);
    if (!state) return null;

    const baseScale = Math.pow(10, state.baseScale);
    const quoteScale = Math.pow(10, state.quoteScale);

    if (state.baseBalance === 0n) return null;

    return (
      Number(state.quoteBalance) /
      quoteScale /
      (Number(state.baseBalance) / baseScale)
    );
  }

  /**
   * Get list of pools
   */
  async getPools(): Promise<PaginatedObjectsResponse> {
    return this.suiClient.getOwnedObjects({
      filter: {
        StructType: `${this.moduleAddress}::clob_v2::Pool`,
      },
      options: {
        showContent: true,
      },
    });
  }

  /**
   * Calculate output amount for swap
   */
  calculateSwapOutput(
    inputAmount: number,
    poolBaseBalance: bigint,
    poolQuoteBalance: bigint,
    baseScale: number,
    quoteScale: number
  ): number {
    const baseScaleBN = BigInt(Math.pow(10, baseScale));
    const quoteScaleBN = BigInt(Math.pow(10, quoteScale));

    const inputAmountBN = BigInt(Math.floor(inputAmount * Number(baseScaleBN)));

    const numerator = inputAmountBN * poolQuoteBalance;
    const denominator = poolBaseBalance + inputAmountBN;

    const outputAmountBN = numerator / denominator;
    return Number(outputAmountBN) / Number(quoteScaleBN);
  }

  /**
   * Utility: Convert base units to decimal
   */
  baseUnitsToDecimal(amount: bigint, decimals: number): number {
    return Number(amount) / Math.pow(10, decimals);
  }

  /**
   * Utility: Convert decimal to base units
   */
  decimalToBaseUnits(amount: number, decimals: number): bigint {
    return BigInt(Math.floor(amount * Math.pow(10, decimals)));
  }
}

export default DeepBookService;
