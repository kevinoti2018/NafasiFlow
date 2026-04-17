// llmClient.ts
import { GoogleGenAI } from "@google/genai";
import {
  prompts,
  type PromptType,
  type CVInput,
  type JobInput,
} from "@/lib/ai/prompts";

// ===============================
// Configuration
// ===============================
const CONFIG = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash-lite",
    maxTokens: 2048,
    temp: 0.1,
    timeoutMs: 15000,
  },
  openRouter: {
    apiKey: process.env.OPEN_ROUTER_API_KEY || "",
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    timeoutMs: 20000,
    models: (process.env.OPENROUTER_MODELS || "openrouter/free").split(","),
  },
  circuitBreaker: {
    failureThreshold: 5, // raised from 3 — more tolerance before opening circuit
    recoveryMs: 30000, // lowered from 60s — recover faster after a blip
  },
  totalBudgetMs: 45000,
  maxJsonRetries: 3, // raised from 2 — extra retry before giving up on JSON
} as const;

// ===============================
// State tracking (circuit breakers, cooldowns)
// ===============================
const providerFailures = new Map<string, number>();
const providerLastFailure = new Map<string, number>();
const modelCooldownUntil = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

function isCircuitClosed(provider: string): boolean {
  const failures = providerFailures.get(provider) || 0;
  if (failures < CONFIG.circuitBreaker.failureThreshold) return true;
  const lastFailure = providerLastFailure.get(provider) || 0;
  if (Date.now() - lastFailure > CONFIG.circuitBreaker.recoveryMs) {
    providerFailures.set(provider, 0);
    return true;
  }
  return false;
}

function recordFailure(provider: string) {
  const failures = (providerFailures.get(provider) || 0) + 1;
  providerFailures.set(provider, failures);
  providerLastFailure.set(provider, Date.now());
}

function resetCircuit(provider: string) {
  providerFailures.set(provider, 0);
}

// ===============================
// Gemini client setup
// ===============================
if (!CONFIG.gemini.apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

const ai = new GoogleGenAI({
  apiKey: CONFIG.gemini.apiKey,
});

// ===============================
// Utilities
// ===============================
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strip markdown code fences that free models commonly add around JSON output.
 * e.g. ```json\n{...}\n``` → {...}
 */
function extractJson(raw: string): any {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(stripped);
}

// ===============================
// Provider implementations
// ===============================
async function callGemini(prompt: string): Promise<string> {
  console.log("[LLM] Gemini: starting");
  try {
    const response = await ai.models.generateContent({
      model: CONFIG.gemini.model,
      contents: prompt,
      config: {
        maxOutputTokens: CONFIG.gemini.maxTokens,
        temperature: CONFIG.gemini.temp,
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from Gemini");
    console.log("[LLM] Gemini: success");
    return text;
  } catch (err) {
    console.error("[LLM] Gemini error:", err);
    throw err;
  }
}

async function callOpenRouter(
  prompt: string,
  budgetRemainingMs: number,
): Promise<string> {
  const now = Date.now();
  const availableModels = CONFIG.openRouter.models.filter((model) => {
    const cooldown = modelCooldownUntil.get(model) || 0;
    return cooldown <= now;
  });

  if (availableModels.length === 0) {
    throw new Error("All OpenRouter models on cooldown");
  }

  let lastError = "No OpenRouter model responded";

  for (const model of availableModels) {
    const elapsed = Date.now() - now;
    if (elapsed > budgetRemainingMs - 2000) break;

    const perModelTimeout = Math.min(
      CONFIG.openRouter.timeoutMs,
      budgetRemainingMs - (Date.now() - now) - 500,
    );
    if (perModelTimeout < 500) break;

    try {
      console.log(`[LLM] OpenRouter trying model: ${model}`);
      const response = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CONFIG.openRouter.apiKey}`,
            "HTTP-Referer": CONFIG.openRouter.baseUrl,
            "X-Title": "CV Optimizer",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: CONFIG.gemini.maxTokens,
            temperature: CONFIG.gemini.temp,
          }),
        },
        perModelTimeout,
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[LLM] OpenRouter ${model} HTTP ${response.status}: ${errorText.slice(0, 200)}`,
        );
        if (
          response.status === 404 ||
          response.status === 429 ||
          response.status >= 500
        ) {
          modelCooldownUntil.set(model, Date.now() + COOLDOWN_MS);
          console.warn(
            `[LLM] OpenRouter model ${model} placed on cooldown for ${COOLDOWN_MS / 1000}s`,
          );
        }
        lastError = `${model}: HTTP ${response.status}`;
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error(`Empty content from ${model}`);
      console.log(`[LLM] OpenRouter ${model}: success`);
      return content;
    } catch (err: any) {
      lastError = `${model}: ${err.message}`;
      console.error(`[LLM] OpenRouter ${model} threw:`, err.message);
      modelCooldownUntil.set(model, Date.now() + COOLDOWN_MS);
    }
  }

  throw new Error(`OpenRouter exhausted all models. Last error — ${lastError}`);
}

// ===============================
// JSON validation & retry
// ===============================
async function callWithJsonRetry(
  providerFn: (prompt: string, budget?: number) => Promise<string>,
  prompt: string,
  budgetRemaining: number,
  retriesLeft: number = CONFIG.maxJsonRetries,
): Promise<any> {
  for (let attempt = 1; attempt <= retriesLeft + 1; attempt++) {
    try {
      const raw = await providerFn(prompt, budgetRemaining);
      // extractJson strips markdown fences before parsing — critical for free models
      const parsed = extractJson(raw);
      return parsed;
    } catch (err: any) {
      if (attempt > retriesLeft) {
        throw new Error(
          `JSON parse failed after ${retriesLeft + 1} attempt(s): ${err.message}`,
        );
      }
      console.warn(
        `[LLM] JSON parse failed (attempt ${attempt}/${retriesLeft + 1}), retrying in ${200 * attempt}ms...`,
      );
      await sleep(200 * attempt);
    }
  }
  throw new Error("Unreachable");
}

// ===============================
// Extended input type for custom prompts
// ===============================
type OptimizeInput = {
  cv?: CVInput;
  job?: JobInput;
  structuredJD?: any;
  primaryChallenge?: string;
  targetPersona?: string;
  customPrompt?: string; // required when promptType === 'custom'
  rawText?: string; // for cvStructure prompt
};

// ===============================
// Main public function
// ===============================
export async function optimizeWithLLM<T = any>(
  promptType: PromptType,
  inputData: OptimizeInput,
): Promise<T> {
  const startTime = Date.now();
  console.log(`[LLM] Starting "${promptType}" optimization`);

  // ── Build prompt ──────────────────────────────────────────────────
  let prompt: string;

  if (promptType === "custom") {
    if (!inputData.customPrompt) {
      throw new Error('customPrompt is required when promptType is "custom"');
    }
    prompt = inputData.customPrompt;
  } else {
    let promptFn: (input: any) => string;

    switch (promptType) {
      case "match":
        promptFn = prompts.match;
        break;
      case "sell":
        promptFn = prompts.sell;
        break;
      case "optimize":
        promptFn = prompts.optimize;
        break;
      case "jd":
        promptFn = prompts.jd;
        break;
      case "cvStructure":
        promptFn = prompts.cvStructure;
        break;
      default:
        throw new Error(`Unknown prompt type: ${promptType}`);
    }

    if (promptType === "cvStructure") {
      if (!inputData.rawText) {
        throw new Error(`rawText is required for prompt type: ${promptType}`);
      }
      prompt = promptFn({ rawText: inputData.rawText });
    } else if (promptType === "jd") {
      if (!inputData.job) {
        throw new Error(`job is required for prompt type: ${promptType}`);
      }
      prompt = promptFn(inputData);
    } else {
      // match, sell, optimize require both cv and job
      if (!inputData.cv || !inputData.job) {
        throw new Error(
          `cv and job are required for prompt type: ${promptType}`,
        );
      }
      prompt = promptFn(inputData);
    }
  }

  // ── OpenRouter (primary) ──────────────────────────────────────────
  if (!isCircuitClosed("openrouter")) {
    console.warn(
      `[LLM] OpenRouter circuit is OPEN (failures: ${providerFailures.get("openrouter") ?? 0}) — skipping straight to Gemini fallback`,
    );
  } else {
    try {
      const remainingBudget = CONFIG.totalBudgetMs - (Date.now() - startTime);
      const result = await callWithJsonRetry(
        (p, budget) => callOpenRouter(p, budget ?? remainingBudget),
        prompt,
        remainingBudget,
      );
      resetCircuit("openrouter");
      console.log(
        `[LLM] "${promptType}" completed via OpenRouter in ${Date.now() - startTime}ms`,
      );
      return result as T;
    } catch (err) {
      recordFailure("openrouter");
      console.error(
        `[LLM] OpenRouter failed — total failures now: ${providerFailures.get("openrouter") ?? 0}. ` +
          `Falling back to Gemini. Reason:`,
        err,
      );
    }
  }

  // ── Gemini (last resort only) ─────────────────────────────────────
  const elapsed = Date.now() - startTime;
  if (elapsed > CONFIG.totalBudgetMs - CONFIG.gemini.timeoutMs) {
    throw new Error(
      `Total budget exhausted (${elapsed}ms elapsed) before Gemini fallback could run`,
    );
  }

  console.warn(
    `[LLM] Falling back to Gemini for "${promptType}" — check OpenRouter logs above to diagnose`,
  );

  try {
    const result = await callWithJsonRetry(
      (p) => callGemini(p),
      prompt,
      CONFIG.totalBudgetMs - elapsed,
    );
    console.log(
      `[LLM] "${promptType}" completed via Gemini (fallback) in ${Date.now() - startTime}ms`,
    );
    return result as T;
  } catch (err) {
    throw new Error(
      `Both providers failed for "${promptType}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
