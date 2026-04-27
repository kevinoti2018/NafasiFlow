// lib/utils/llmclient.ts
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
    failureThreshold: 3,
    recoveryMs: 60000,
  },
  totalBudgetMs: 45000,
  maxJsonRetries: 2,
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

// ===============================
// Helper to extract JSON from markdown code blocks
// ===============================
function extractJsonFromMarkdown(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
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
      console.log(`[LLM] OpenRouter trying ${model}`);
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
          `[LLM] ${model} HTTP ${response.status}: ${errorText.slice(0, 100)}`,
        );
        if (response.status === 404) {
          modelCooldownUntil.set(model, Date.now() + COOLDOWN_MS);
        } else if (response.status >= 500 || response.status === 429) {
          modelCooldownUntil.set(model, Date.now() + COOLDOWN_MS);
        }
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("Empty content");
      console.log(`[LLM] OpenRouter ${model} succeeded`);
      return content;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = `${model}: ${message}`;
      modelCooldownUntil.set(model, Date.now() + COOLDOWN_MS);
    }
  }
  throw new Error(lastError);
}

// ===============================
// JSON validation & retry (with markdown stripping)
// ===============================
async function callWithJsonRetry(
  providerFn: (prompt: string, budget?: number) => Promise<string>,
  prompt: string,
  budgetRemaining: number,
  retriesLeft: number = CONFIG.maxJsonRetries,
): Promise<unknown> {
  for (let attempt = 1; attempt <= retriesLeft + 1; attempt++) {
    try {
      const raw = await providerFn(prompt, budgetRemaining);
      const jsonString = extractJsonFromMarkdown(raw);
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (err: unknown) {
      if (attempt > retriesLeft) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(
          `JSON parse failed after ${retriesLeft + 1} attempts: ${errorMessage}`,
        );
      }
      console.warn(`[LLM] JSON parse failed (attempt ${attempt}), retrying...`);
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
  structuredJD?: unknown;
  primaryChallenge?: string;
  targetPersona?: string;
  customPrompt?: string;
  rawText?: string; // for cvStructure
  // LinkedIn optimization sections
  headline?: string;
  about?: string;
  experience?: string;
  skills?: string;
  certifications?: string;
  education?: string;
  volunteering?: string;
  section?: string;
  content?: string;
};

// ===============================
// Main public function (supports custom prompts)
// ===============================
export async function optimizeWithLLM<T = unknown>(
  promptType: PromptType,
  inputData: OptimizeInput,
): Promise<T> {
  const startTime = Date.now();
  console.log(`[LLM] Starting ${promptType} optimization`);

  let prompt: string;

  // Handle custom prompt type
  if (promptType === "custom") {
    if (!inputData.customPrompt) {
      throw new Error('customPrompt is required when promptType is "custom"');
    }
    prompt = inputData.customPrompt;
  } else {
    // Use predefined prompt functions
    let promptFn: (input: unknown) => string;
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
      case "linkedinOptimizeStructured":
        promptFn = prompts.linkedinOptimizeStructured;
        break;
      case "linkedinOptimizeSection":
        promptFn = prompts.linkedinOptimizeSection;
        break;
      default:
        throw new Error(`Unknown prompt type: ${promptType}`);
    }

    // Validate required fields based on prompt type
    if (promptType === "cvStructure") {
      if (!inputData.rawText) {
        throw new Error(`rawText is required for prompt type: ${promptType}`);
      }
      prompt = promptFn({ rawText: inputData.rawText });
    } else if (promptType === "linkedinOptimizeStructured") {
      prompt = promptFn({
        headline: inputData.headline || "",
        about: inputData.about || "",
        experience: inputData.experience || "",
        skills: inputData.skills || "",
        certifications: inputData.certifications || "",
        education: inputData.education || "",
        volunteering: inputData.volunteering || "",
      });
    } else if (promptType === "jd") {
      if (!inputData.job) {
        throw new Error(`job is required for prompt type: ${promptType}`);
      }
      prompt = promptFn(inputData);
    } else if (promptType === "linkedinOptimizeSection") {
      if (!inputData.section || !inputData.content) {
        throw new Error(
          `section and content are required for prompt type: ${promptType}`,
        );
      }
      prompt = promptFn({
        section: inputData.section,
        content: inputData.content,
      });
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

  // Try OpenRouter first if its circuit is closed
  if (isCircuitClosed("openrouter")) {
    try {
      const remainingBudget = CONFIG.totalBudgetMs - (Date.now() - startTime);
      const result = await callWithJsonRetry(
        (p, budget) => callOpenRouter(p, budget || remainingBudget),
        prompt,
        remainingBudget,
      );
      resetCircuit("openrouter");
      console.log(
        `[LLM] ${promptType} completed via OpenRouter in ${Date.now() - startTime}ms`,
      );
      return result as T;
    } catch (err) {
      recordFailure("openrouter");
      console.error("[LLM] OpenRouter failed, falling back to Gemini", err);
    }
  }

  // Fallback to Gemini
  const elapsed = Date.now() - startTime;
  if (elapsed > CONFIG.totalBudgetMs - CONFIG.gemini.timeoutMs) {
    throw new Error("Total budget exhausted before Gemini fallback");
  }

  try {
    const result = await callWithJsonRetry(
      (p) => callGemini(p),
      prompt,
      CONFIG.totalBudgetMs - elapsed,
    );
    console.log(
      `[LLM] ${promptType} completed via Gemini in ${Date.now() - startTime}ms`,
    );
    return result as T;
  } catch (err) {
    throw new Error(
      `Both providers failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
