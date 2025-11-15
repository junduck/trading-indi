/**
 * Period configuration for indicators.
 * Provides flexible period options for various indicator types.
 */
export interface PeriodOptions {
  period?: number;
  period_long?: number;
  period_med?: number;
  period_short?: number;
  period_signal?: number;
}

/**
 * Utility type to require specific period fields.
 * @example PeriodWith<'period'> ensures period is required
 */
export type PeriodWith<K extends keyof PeriodOptions> = Required<
  Pick<PeriodOptions, K>
>;
