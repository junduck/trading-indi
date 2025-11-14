# trading-indi

A TypeScript library providing technical indicators for trading, designed for **incremental, stateful calculation** perfect for intraday and realtime trading applications.

## Why trading-indi?

Traditional technical indicator libraries recalculate entire datasets on each new data point. **trading-indi** is different:

- **Incremental Calculation**: Each indicator maintains internal state and updates efficiently with each new data point
- **Perfect for Realtime Trading**: Designed for WebSocket streams, tick data, and intraday strategies
- **Memory Efficient**: Uses sliding windows and online algorithms
- **Consistent API**: Every indicator follows the same class/hook pattern
- **Zero Dependencies**: Clean, modern TypeScript

## Installation

> **Note**: This package is not yet published on npm. You can install it directly from the GitHub repository:

```bash
npm install https://github.com/junduck/trading-indi.git
# or
pnpm add https://github.com/junduck/trading-indi.git
```

## Quick Start

### Class-Based Usage (Stateful)

```typescript
import { RSI, EMA, MACD } from 'trading-indi';

const rsi = new RSI({ period: 14 });
const ema = new EMA({ period: 20 });
const macd = new MACD({
  period_short: 12,
  period_long: 26,
  period_signal: 9
});

// Process streaming data
priceStream.on('data', (bar) => {
  const rsiValue = rsi.onData(bar);
  const emaValue = ema.onData(bar.close);
  const { macd: macdLine, signal, histogram } = macd.onData(bar);

  console.log({ rsiValue, emaValue, macdLine });
});
```

### Functional Usage (Hooks)

```typescript
import { useRSI, useEMA, useMACD } from 'trading-indi';

const getRSI = useRSI({ period: 14 });
const getEMA = useEMA({ period: 20 });
const getMACD = useMACD({
  period_short: 12,
  period_long: 26,
  period_signal: 9
});

for (const bar of historicalData) {
  const rsiValue = getRSI(bar);
  const emaValue = getEMA(bar.close);
  const { macd, signal, histogram } = getMACD(bar);
}
```

## Available Indicators

### Foundation

| Indicator | Parameters | Output |
|-----------|------------|--------|
| **EMA** | `period` or `alpha` | `number` |
| **SMA** | `period` | `number` |
| **Variance** | `period`, `ddof?` | `{mean: number, variance: number}` |
| **MinMax** | `period` | `{min: number, max: number}` |

### Volatility

| Indicator | Parameters | Output |
|-----------|------------|--------|
| **VOLATILITY** | `period`, `annualizedDays?` | `number` |
| **CVI** | `period` | `number` |
| **MASS** | `period` | `number` |
| **TR** | none | `number` |
| **ATR** | `period` | `number` |
| **NATR** | `period` | `number` |

### Momentum

| Indicator | Parameters | Output |
|-----------|------------|--------|
| **BOP** | none | `number` |
| **MOM** | `period` | `number` |
| **ROC** | `period` | `number` |
| **ROCR** | `period` | `number` |
| **RSI** | `period` | `number` |
| **CMO** | `period` | `number` |
| **WAD** | none | `number` |

### Oscillators

| Indicator | Parameters | Output |
|-----------|------------|--------|
| **AO** | none | `number` |
| **APO** | `period_short`, `period_long` | `number` |
| **DPO** | `period` | `number` |
| **Fisher** | `period` | `number` |
| **MACD** | `period_short`, `period_long`, `period_signal` | `{macd, signal, histogram}` |
| **PPO** | `period_short`, `period_long` | `number` |
| **QSTICK** | `period` | `number` |
| **TRIX** | `period` | `number` |
| **ULTOSC** | `period_short`, `period_med`, `period_long` | `number` |

### Stochastic

| Indicator | Parameters | Output |
|-----------|------------|--------|
| **STOCH** | `k_period?`, `k_slowing?`, `d_period?` | `{k, d}` |
| **STOCHRSI** | `period` | `number` |
| **WILLR** | `period` | `number` |

### Trend

| Indicator | Parameters | Output |
|-----------|------------|--------|
| **AROON** | `period` | `{up, down}` |
| **AROONOSC** | `period` | `number` |
| **CCI** | `period` | `number` |
| **VHF** | `period` | `number` |
| **DM** | `period` | `{plus, minus}` |
| **DI** | `period` | `{plus, minus}` |
| **DX** | `period` | `number` |
| **ADX** | `period` | `number` |
| **ADXR** | `period` | `number` |

### Volume

| Indicator | Parameters | Output |
|-----------|------------|--------|
| **AD** | none | `number` |
| **ADOSC** | `period_short`, `period_long` | `number` |
| **KVO** | `period_short?`, `period_long?` | `number` |
| **NVI** | none | `number` |
| **OBV** | none | `number` |
| **PVI** | none | `number` |
| **MFI** | `period` | `number` |
| **EMV** | none | `number` |
| **MARKETFI** | none | `number` |
| **VOSC** | `period_short`, `period_long` | `number` |

## Real-World Example: Intraday Strategy

```typescript
import { RSI, ATR, EMA } from 'trading-indi';

const rsi = new RSI({ period: 14 });
const atr = new ATR({ period: 14 });
const ema20 = new EMA({ period: 20 });
const ema50 = new EMA({ period: 50 });

websocket.on('tick', (bar) => {
  const rsiValue = rsi.onData(bar);
  const atrValue = atr.onData(bar);
  const shortEMA = ema20.onData(bar.close);
  const longEMA = ema50.onData(bar.close);

  if (rsiValue < 30 && shortEMA > longEMA) {
    console.log('Oversold + Bullish Trend - Consider Buy');
    console.log(`Stop Loss: ${atrValue * 2} points`);
  }
});
```

## Bar Data Types

Most indicators accept `BarData` with these properties:

```typescript
interface BarData {
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}
```

Each indicator only requires the fields it needs. Check TypeScript types for specific requirements.

## License

MIT
