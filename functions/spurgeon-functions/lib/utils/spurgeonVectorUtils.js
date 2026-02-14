import fs from "fs";
import path from "path";
import readline from "readline";
import {
  ConfigurationError,
  ExternalApiError,
  ValidationError,
} from "./routeUtils.js";

const sermonBodiesCache = {
  path: null,
  promise: null,
};

const normalizePath = (filePath) =>
  path.isAbsolute(filePath) ? filePath : path.resolve(filePath);

export const requireEnv = (keys) => {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new ConfigurationError(`Missing env vars: ${missing.join(", ")}`);
  }
};

export const getRequestValue = (body, query, key) => {
  if (body && Object.prototype.hasOwnProperty.call(body, key)) {
    return body[key];
  }
  if (query && Object.prototype.hasOwnProperty.call(query, key)) {
    return query[key];
  }
  return undefined;
};

export const parseNumber = (value, fallback, label) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${label} must be a number.`);
  }
  return parsed;
};

export const extractResponseText = (payload) => {
  const output = payload.output || [];
  let text = "";
  for (const item of output) {
    const content = item.content || [];
    for (const block of content) {
      if (block.type === "output_text" || block.type === "text") {
        text += block.text || "";
      }
    }
  }
  return text.trim();
};

export const getUsageFromResponses = (payload) => {
  const usage = payload?.usage || {};
  const inputTokens = Number(usage.input_tokens || 0);
  const outputTokens = Number(usage.output_tokens || 0);
  const cachedInputTokens = Number(
    usage.input_tokens_details?.cached_tokens || 0
  );
  const totalTokens =
    Number(usage.total_tokens || 0) || inputTokens + outputTokens;

  return {
    input_tokens: inputTokens,
    cached_input_tokens: cachedInputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
  };
};

export const getUsageFromEmbeddings = (payload) => {
  const usage = payload?.usage || {};
  const inputTokens = Number(
    usage.prompt_tokens ?? usage.input_tokens ?? 0
  );
  const totalTokens = Number(usage.total_tokens || 0) || inputTokens;

  return {
    input_tokens: inputTokens,
    cached_input_tokens: 0,
    output_tokens: 0,
    total_tokens: totalTokens,
  };
};

export const openAIResponses = async ({ model, system, user }) => {
  requireEnv(["OPENAI_API_KEY"]);
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ExternalApiError(
      `OpenAI responses failed (${response.status})`,
      response.status,
      { body: text }
    );
  }
  try {
    return await response.json();
  } catch (error) {
    throw new ExternalApiError("OpenAI responses returned invalid JSON.", 502, {
      error: error.message,
    });
  }
};

export const openAIEmbeddings = async ({ model, input }) => {
  requireEnv(["OPENAI_API_KEY"]);
  const apiKey = process.env.OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new ExternalApiError(
      `OpenAI embeddings failed (${response.status})`,
      response.status,
      { body: text }
    );
  }
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ExternalApiError("OpenAI embeddings returned invalid JSON.", 502, {
      error: error.message,
    });
  }

  const data = payload.data || [];
  if (!data.length) {
    throw new ExternalApiError(
      "OpenAI embeddings response had no data.",
      502,
      { payload }
    );
  }
  return {
    embedding: data[0].embedding,
    usage: getUsageFromEmbeddings(payload),
  };
};

const readSermonBodiesMap = async (filePath) => {
  const map = new Map();
  const input = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  for await (const rawLine of rl) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const obj = JSON.parse(line);
    const id = obj.id;
    if (!id) {
      continue;
    }
    map.set(String(id), obj.body || "");
  }
  return map;
};

export const getSermonBodiesMap = async (filePath) => {
  const resolved = normalizePath(filePath);
  if (!fs.existsSync(resolved)) {
    throw new ConfigurationError(
      `Sermon bodies file not found at ${resolved}.`
    );
  }
  if (sermonBodiesCache.path === resolved && sermonBodiesCache.promise) {
    return sermonBodiesCache.promise;
  }
  sermonBodiesCache.path = resolved;
  sermonBodiesCache.promise = readSermonBodiesMap(resolved);
  return sermonBodiesCache.promise;
};
