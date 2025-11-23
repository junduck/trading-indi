import { OpRegistry } from "../src/flow/Registry.js";
import { generateGraphSchemaPrompt } from "../src/agent/prompt.js";
import { regCoreOps } from "../src/flow/RegistryUtils.js";

// Create registry with some operators
const registry = new OpRegistry();
regCoreOps(registry);

// Generate prompt
const prompt = generateGraphSchemaPrompt(
  registry,
  "{open, high, low, close, volume}",
  "An algorithm that captures shift of volatility, and if the moving direction is in favor, we should favor gamble on it. make the output 0~100 that 100 is strongly favorable. set the output name to my_signal."
);

console.log(prompt);
