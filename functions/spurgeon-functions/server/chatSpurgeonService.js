import {
  extractResponseText,
  getUsageFromResponses,
  requireEnv,
} from "../lib/utils/spurgeonVectorUtils.js";
import { ExternalApiError, ValidationError } from "../lib/utils/routeUtils.js";
import { searchSpurgeonIndexService } from "./searchSpurgeonIndexService.js";

const DEFAULT_MODEL = "gpt-5";
const CLASSIFICATION_MODEL = "gpt-5-nano";
const DEFAULT_TOPK_THEOLOGICAL = 2;
const DEFAULT_TOPK_DEVOTIONAL = 3;

const SYSTEM_PROMPT =
  "You are Charles Spurgeon, speaking in a warm, pastoral 19th-century tone. " +
  "Hold theological conversations with clarity, humility, and scriptural fidelity. " +
  "When helpful, you can craft devotionals grounded in Scripture. " +
  "If the question is theological, you must ground your reply in the provided search results. " +
  "Ask clarifying questions if the user's request is unclear.";

const SPURGEON_SEARCH_TOOL = "spurgeon.search";
const CLASSIFICATION_SYSTEM =
  "Classify the user's message into exactly one category: " +
  '"theological", "casual", "create_devotional", or "inappropriate". ' +
  "Theological means faith, doctrine, Scripture, prayer, devotion, church life, or moral counsel. " +
  "Create_devotional means the user is explicitly asking for a devotional or meditation. " +
  "Casual means greetings, small talk, or simple pleasantries. " +
  "Inappropriate means abusive, sexual, hateful, illegal, or unrelated to a theological discussion. " +
  "Reply with JSON only in the format {\"category\":\"theological|casual|create_devotional|inappropriate\",\"reason\":\"short\"}.";

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
};

const toMessage = (entry) => ({
  role: entry.role,
  content: entry.content,
});

const buildInputMessages = (history, message, searchContext, extraInstruction) => {
  const input = [{ role: "system", content: SYSTEM_PROMPT }];
  for (const entry of history) {
    if (!entry || !entry.role || !entry.content) {
      continue;
    }
    if (entry.role !== "user" && entry.role !== "assistant") {
      continue;
    }
    input.push(toMessage(entry));
  }
  if (searchContext) {
    input.push({
      role: "system",
      content:
        "Search results (JSON). Use these excerpts as your grounding context. " +
        "Do not invent citations beyond what is provided.\n" +
        searchContext,
    });
  }
  if (extraInstruction) {
    input.push({ role: "system", content: extraInstruction });
  }
  input.push({ role: "user", content: message });
  return input;
};

const outOfScopeReply = () =>
  "Beloved, this matter lies beyond my appointed sphere of discourse. " +
  "If you have a question of theology, Scripture, or devotion, I would gladly speak to it.";

const isUnsupportedParamError = (details, paramName) => {
  const body = details?.body;
  if (!body || typeof body !== "string") {
    return false;
  }
  return body.includes(`Unsupported parameter: '${paramName}'`);
};

const callOpenAI = async (payload, options = {}) => {
  requireEnv(["OPENAI_API_KEY"]);
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    const error = new ExternalApiError(
      `OpenAI responses failed (${response.status})`,
      response.status,
      { body: text }
    );
    if (options.retryWithoutTemperature && response.status === 400) {
      const shouldRetry = isUnsupportedParamError(error.details, "temperature");
      if (shouldRetry) {
        const { temperature, ...fallbackPayload } = payload;
        return await callOpenAI(fallbackPayload);
      }
    }
    throw error;
  }
  try {
    return await response.json();
  } catch (error) {
    throw new ExternalApiError("OpenAI responses returned invalid JSON.", 502, {
      error: error.message,
    });
  }
};

const parseClassification = (text) => {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const classifyMessage = async (message, model) => {
  const response = await callOpenAI(
    {
      model,
      input: [
        { role: "system", content: CLASSIFICATION_SYSTEM },
        { role: "user", content: message },
      ],
    },
    { retryWithoutTemperature: true }
  );
  const text = extractResponseText(response);
  const parsed = parseClassification(text);
  const category = parsed?.category ? String(parsed.category).toLowerCase() : "";
  if (
    category === "theological" ||
    category === "casual" ||
    category === "create_devotional" ||
    category === "inappropriate"
  ) {
    return category;
  }
  return "theological";
};

const trimSearchResults = (payload) => {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return {
    results: results.map((result) => ({
      title: result?.title ?? "",
      url: result?.url ?? "",
      sermon_id: result?.sermon_id ?? "",
      excerpt: result?.excerpt ?? "",
    })),
  };
};

const runSearch = async (question, topK) => {
  try {
    const payload = await searchSpurgeonIndexService({
      body: { question, topK },
      query: {},
    });
    return { output: trimSearchResults(payload), isError: false };
  } catch (error) {
    return {
      output: { error: error?.message ? String(error.message) : String(error) },
      isError: true,
    };
  }
};

export const chatSpurgeonService = async ({ body = {}, query = {} }) => {
  const shouldLogMemory =
    String(process.env.SPURGEON_LOG_MEMORY || "").toLowerCase() === "true";
  const startMemory = shouldLogMemory ? process.memoryUsage() : null;
  const startTime = shouldLogMemory ? Date.now() : null;

  try {
    const message =
      body?.message ??
      query?.message ??
      body?.question ??
      query?.question ??
      body?.prompt ??
      query?.prompt;
    const normalizedMessage = normalizeString(message);
    if (!normalizedMessage) {
      throw new ValidationError("Message is required.");
    }

    const history = Array.isArray(body?.history) ? body.history : [];
    const model = normalizeString(body?.model || DEFAULT_MODEL);
    const temperature =
      body?.temperature === undefined ? undefined : Number(body.temperature);
    const hasTemperature = Number.isFinite(temperature);

    const toolRuns = [];
    let response;
    let totalUsage = {
      input_tokens: 0,
      cached_input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
    };

    const classificationPromise = classifyMessage(
      normalizedMessage,
      CLASSIFICATION_MODEL
    );
    const theologicalSearchPromise = runSearch(
      normalizedMessage,
      DEFAULT_TOPK_THEOLOGICAL
    );
    const devotionalSearchPromise = runSearch(
      normalizedMessage,
      DEFAULT_TOPK_DEVOTIONAL
    );

    const category = await classificationPromise;

    if (category === "casual") {
      response = await callOpenAI(
        {
          model,
          input: buildInputMessages(history, normalizedMessage),
          ...(hasTemperature ? { temperature } : {}),
        },
        { retryWithoutTemperature: true }
      );
      totalUsage = getUsageFromResponses(response);
      const reply = extractResponseText(response);
      if (!reply) {
        throw new ExternalApiError("No text returned from model.", 502, { model });
      }
      return {
        reply,
        model,
        usage: totalUsage,
        tool_runs: toolRuns,
      };
    }

    if (category === "inappropriate") {
      return {
        reply: outOfScopeReply(),
        model,
        usage: totalUsage,
        tool_runs: toolRuns,
      };
    }

    let searchOutput = null;
    const devotionalInstruction =
      "The user asked for a devotional. Write a devotional in Spurgeon's voice " +
      "using the provided search excerpts as the grounding material.";
    const theologicalInstruction = "Keep the response under 200 words.";

    const topK =
      category === "create_devotional"
        ? DEFAULT_TOPK_DEVOTIONAL
        : DEFAULT_TOPK_THEOLOGICAL;
    const searchPromise =
      topK === DEFAULT_TOPK_DEVOTIONAL
        ? devotionalSearchPromise
        : theologicalSearchPromise;

    const { output, isError } = await searchPromise;
    searchOutput = output;
    toolRuns.push({
      name: SPURGEON_SEARCH_TOOL,
      arguments: { question: normalizedMessage, topK },
      output: searchOutput,
      isError,
    });

    const extraInstruction =
      category === "create_devotional"
        ? devotionalInstruction
        : theologicalInstruction;
    const input = buildInputMessages(
      history,
      normalizedMessage,
      JSON.stringify(searchOutput, null, 2),
      extraInstruction
    );

    response = await callOpenAI(
      {
        model,
        input,
        ...(hasTemperature ? { temperature } : {}),
      },
      { retryWithoutTemperature: true }
    );
    totalUsage = getUsageFromResponses(response);

    const reply = extractResponseText(response);
    if (!reply) {
      throw new ExternalApiError("No text returned from model.", 502, { model });
    }

    return {
      reply,
      model,
      usage: totalUsage,
      tool_runs: toolRuns,
    };
  } finally {
    if (shouldLogMemory && startMemory && startTime !== null) {
      const endMemory = process.memoryUsage();
      const elapsedMs = Date.now() - startTime;
      const delta = {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
      };
      console.log("[chatSpurgeonService] memory", {
        elapsed_ms: elapsedMs,
        start: startMemory,
        end: endMemory,
        delta,
      });
    }
  }
};
