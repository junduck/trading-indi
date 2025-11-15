/**
 * OHLCV bar data for technical analysis.
 * Only close is required; other fields optional for flexibility.
 */
export interface BarData {
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

/**
 * Utility type to require specific BarData fields.
 * @example BarWith<'close' | 'volume'> ensures close and volume are present
 */
export type BarWith<K extends keyof BarData> = Required<Pick<BarData, K>>;
