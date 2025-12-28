import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { restateQuestion } from "./01_vector_restate_question.js";
import { queryVectors } from "./02_vector_query_spurgeon.js";
import { generateDevotional } from "./03_vector_generate_devotional.js";

function parseArgs(argv) {
  const args = { question: "", topK: 5 };
  const positional = [];
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--question") {
      args.question = argv[i + 1] || "";
      i += 1;
    } else if (token === "--topk") {
      args.topK = Number(argv[i + 1] || 5);
      i += 1;
    } else {
      positional.push(token);
    }
  }
  if (!args.question && positional.length) {
    args.question = positional[0];
  }
  if (positional.length > 1 && Number.isFinite(Number(positional[1]))) {
    args.topK = Number(positional[1]);
  }
  return args;
}

async function withTiming(label, fn) {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  return { label, result, duration_ms: durationMs };
}

function normalizeUsage(usage) {
  const safe = usage || {};
  const inputTokens = Number(safe.input_tokens || 0);
  const cachedInputTokens = Number(safe.cached_input_tokens || 0);
  const outputTokens = Number(safe.output_tokens || 0);
  const totalTokens =
    Number(safe.total_tokens || 0) || inputTokens + outputTokens;

  return {
    input_tokens: inputTokens,
    cached_input_tokens: cachedInputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
  };
}

function estimateGpt5Cost(usage) {
  const inputTokens = usage.input_tokens || 0;
  const cachedInputTokens = usage.cached_input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const billableInput = Math.max(0, inputTokens - cachedInputTokens);
  const cost =
    (billableInput * 1.25 +
      cachedInputTokens * 0.125 +
      outputTokens * 10.0) /
    1e6;
  return cost;
}

function buildMetrics(durationMs, usage, costModel) {
  const tokens = normalizeUsage(usage);
  const estimatedCost = costModel === "gpt-5" ? estimateGpt5Cost(tokens) : 0;

  return {
    timings_ms: durationMs,
    tokens_used: tokens,
    estimated_cost: estimatedCost,
  };
}

async function main() {
  const { question, topK } = parseArgs(process.argv);
  if (!question.trim()) {
    throw new Error(
      "Usage: node scripts/spurgeon/00_vector_qa_pipeline_orchestrator.js --question \"...\" [--topk 5]"
    );
  }

  const restateStep = await withTiming("restate_question", () =>
    restateQuestion({ question })
  );
  const queryStep = await withTiming("query_vectors", () =>
    queryVectors({ question: restateStep.result.restated, topK })
  );
  const devotionalStep = await withTiming("generate_devotional", () =>
    generateDevotional({
      question: restateStep.result.restated,
      excerpts: queryStep.result.results,
    })
  );

  const restated = {
    original: restateStep.result.original,
    restated: restateStep.result.restated,
    model: restateStep.result.model,
  };
  const excerpts = {
    query: queryStep.result.query,
    results: queryStep.result.results,
  };

  const output = {
    question,
    restated,
    excerpts,
    devotional: devotionalStep.result.devotional,
    metrics: {
      restate_question: buildMetrics(
        restateStep.duration_ms,
        restateStep.result.usage,
        "gpt-5"
      ),
      query_vectors: buildMetrics(
        queryStep.duration_ms,
        queryStep.result.usage,
        "embeddings"
      ),
      generate_devotional: buildMetrics(
        devotionalStep.duration_ms,
        devotionalStep.result.usage,
        "gpt-5"
      ),
    },
  };

  output.metrics.summary = {
    total_timings_ms:
      output.metrics.restate_question.timings_ms +
      output.metrics.query_vectors.timings_ms +
      output.metrics.generate_devotional.timings_ms,
    total_estimated_cost:
      output.metrics.restate_question.estimated_cost +
      output.metrics.query_vectors.estimated_cost +
      output.metrics.generate_devotional.estimated_cost,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = path.resolve(
    "results",
    `00_vector_qa_pipeline_orchestrator_${timestamp}.json`
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(outPath);
}

const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
