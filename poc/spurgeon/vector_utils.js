import fs from "fs";
import path from "path";
import readline from "readline";

function loadEnv(envPath = ".env") {
  const fullPath = path.resolve(envPath);
  if (!fs.existsSync(fullPath)) {
    return;
  }
  const contents = fs.readFileSync(fullPath, "utf-8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const parts = line.split("=");
    const key = parts.shift().trim();
    const value = parts.join("=").trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requireEnv(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

async function readSermonBodiesMap(filePath) {
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
}

function extractResponseText(payload) {
  const output = payload.output || [];
  let text = "";
  for (const item of output) {
    const content = item.content || [];
    for (const block of content) {
      if (block.type === "output_text") {
        text += block.text || "";
      }
    }
  }
  return text.trim();
}

function getUsageFromResponses(payload) {
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
}

function getUsageFromEmbeddings(payload) {
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
}

async function openAIResponses({ model, system, user }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
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
    throw new Error(`OpenAI responses failed (${response.status}): ${text}`);
  }
  return response.json();
}

async function openAIEmbeddings({ model, input }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
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
    throw new Error(`OpenAI embeddings failed (${response.status}): ${text}`);
  }
  const payload = await response.json();
  const data = payload.data || [];
  if (!data.length) {
    throw new Error("OpenAI embeddings response had no data.");
  }
  return {
    embedding: data[0].embedding,
    usage: getUsageFromEmbeddings(payload),
  };
}

export {
  loadEnv,
  requireEnv,
  readSermonBodiesMap,
  extractResponseText,
  getUsageFromResponses,
  openAIResponses,
  openAIEmbeddings,
};
