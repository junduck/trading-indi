import { OpRegistry } from "../src/flow/Registry.js";
import { EMA, SMA, Stddev } from "../src/fn/index.js";

// Create a registry and register operators
const registry = new OpRegistry()
  .register(EMA)
  .register(SMA)
  .register(Stddev);

// Get all operator contexts as JSON
const contexts = registry.getAllContexts();

console.log("Registered Operators:");
console.log(JSON.stringify(contexts, null, 2));

// Get a specific operator context
const emaContext = registry.getContext("EMA");
console.log("\nEMA Operator Context:");
console.log(JSON.stringify(emaContext, null, 2));
