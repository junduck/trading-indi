import type { OpRegistry } from "../flow/Registry.js";
import type { GraphSchema, GraphError } from "../flow/Schema.js";
import { validateGraphSchema } from "../flow/Schema.js";

/**
 * Agent feedback action types.
 */
export enum AgentFeedbackAction {
  SUCCESS = "success",
  FIX_JSON = "fix_json",
  FIX_SCHEMA = "fix_schema",
  NEEDS_EVAL = "needs_eval",
  USER_INPUT = "user_input",
}

/**
 * Feedback for AI agent after processing GraphSchema.
 */
export interface AgentFeedback {
  schema?: GraphSchema;
  action: AgentFeedbackAction;
  parseError?: string;
  validationErrors?: GraphError[];
  evalMessage?: string;
  userInput?: string;
}

/**
 * Generate agent prompt for GraphSchema creation.
 * @param registry Available operators registry
 * @param rootDataType Description of root data structure (e.g., "{open, high, low, close, volume}")
 * @param userPrompt User's request description
 * @returns Prompt string for AI agent
 */
export function generateGraphSchemaPrompt(
  registry: OpRegistry,
  rootDataType: string,
  userPrompt: string
): string {
  const operatorDocs = JSON.stringify(
    Object.fromEntries(registry.getAllContexts()),
    null,
    2
  );

  // rootDataType: describes what root data event is:
  // E.g. {open, high, low, close, volume, timestamp}
  // E.g. {price, volume, timestamp}
  // E.g. {price, breakingNews: string}

  return `# Task: Generate GraphSchema

You are an expert in creating computation DAGs for technical indicators.

## Available Operators

${operatorDocs}

## Root Data Type

The root data event has the following structure:
${rootDataType}

## GraphSchema Format

Generate a JSON object with this structure:

\`\`\`json
{
  "root": string,        // Input node name (e.g., "tick", "price")
  "nodes": [
    {
      "name": string,         // Unique node identifier
      "type": string,         // Operator type from available operators
      "init": object,         // Constructor parameters (optional)
      "inputSrc": string[] // Input paths (e.g., ["tick"], ["fast", "slow"], ["tick.close"])
    }
  ]
}
\`\`\`

## Rules

1. **Root node**: External data entry point, typically "tick" or "price"
2. **Input paths**: Reference nodes by name or path (e.g., "ema", "tick.close" for access nested fields)
3. **No cycles**: DAG structure required
4. **Match parameters**: Each node's inputSrc must match its operator's input arity

## Examples

**Simple EMA**:
root data event: {price: number, volume: number}
\`\`\`json
{
  "root": "tick",
  "nodes": [
    {
      "name": "ema",
      "type": "EMA",
      "init": {"period": 20},
      "inputSrc": ["tick.price"]
    }
  ]
}
\`\`\`

**MACD (Moving Average Convergence Divergence)**:
root data event: number
\`\`\`json
{
  "root": "price",
  "nodes": [
    {
      "name": "fast",
      "type": "EMA",
      "init": {"period": 12},
      "inputSrc": ["price"]
    },
    {
      "name": "slow",
      "type": "EMA",
      "init": {"period": 26},
      "inputSrc": ["price"]
    },
    {
      "name": "macd",
      "type": "Sub",
      "inputSrc": ["fast", "slow"]
    }
  ]
}
\`\`\`

## User Request

${userPrompt}

## Output

Generate ONLY the GraphSchema JSON. Do not include explanations or markdown code blocks.`;
}

/**
 * Parses AI response to extract GraphSchema JSON and validates it.
 * @param response AI agent response
 * @param registry Operator registry for validation
 * @returns AgentFeedback with schema and validation results
 */
export function parseGraphSchemaResponse(
  response: string,
  registry: OpRegistry
): AgentFeedback {
  let schema: GraphSchema | undefined;
  let jsonText: string | undefined;

  try {
    const trimmed = response.trim();

    // Try direct parse first
    if (trimmed.startsWith("{")) {
      jsonText = trimmed;
    }
    // Extract from markdown code block
    else {
      const jsonMatch = trimmed.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // Find first { and last } for lenient parsing
        const start = trimmed.indexOf("{");
        const end = trimmed.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          jsonText = trimmed.slice(start, end + 1);
        }
      }
    }

    if (!jsonText) {
      return {
        action: AgentFeedbackAction.FIX_JSON,
        parseError: "No JSON object found in response",
      };
    }

    schema = JSON.parse(jsonText) as GraphSchema;
  } catch (error) {
    return {
      action: AgentFeedbackAction.FIX_JSON,
      parseError: `JSON parse error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  // Validate the parsed schema
  const validation = validateGraphSchema(schema, registry);
  if (!validation.valid) {
    return {
      schema,
      action: AgentFeedbackAction.FIX_SCHEMA,
      validationErrors: validation.errors,
    };
  }

  return {
    schema,
    action: AgentFeedbackAction.SUCCESS,
  };
}

/**
 * Complete workflow: generate prompt, get AI response, parse and validate result.
 * @param registry Available operators
 * @param rootDataType Description of root data structure
 * @param userPrompt User's indicator request
 * @param aiFunction Function that calls AI with prompt and returns response
 * @returns AgentFeedback with schema and validation results
 */
export async function generateGraphSchema(
  registry: OpRegistry,
  rootDataType: string,
  userPrompt: string,
  aiFunction: (prompt: string) => Promise<string>
): Promise<AgentFeedback> {
  const prompt = generateGraphSchemaPrompt(registry, rootDataType, userPrompt);
  const response = await aiFunction(prompt);
  return parseGraphSchemaResponse(response, registry);
}
