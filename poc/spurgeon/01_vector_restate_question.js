import {
  loadEnv,
  requireEnv,
  openAIResponses,
  extractResponseText,
  getUsageFromResponses,
} from "./vector_utils.js";

async function restateQuestion({ question, model = "gpt-5" }) {
  if (!question || !question.trim()) {
    throw new Error("Question or topic is required.");
  }

  loadEnv();
  requireEnv(["OPENAI_API_KEY"]);

  const system =
    "You rewrite question or topic into a concise, reverent, 19th-century sermon style. " +
    "Preserve intent, avoid new claims, and keep the question optimized for retrieval on a vector db index of Spurgeon sermons.";
  const user = JSON.stringify({ question });

  const payload = await openAIResponses({ model, system, user });
  const text = extractResponseText(payload);
  if (!text) {
    throw new Error("No text returned from model.");
  }

  return {
    original: question,
    restated: text,
    model,
    usage: getUsageFromResponses(payload),
  };
}

export { restateQuestion };
