import {
  extractResponseText,
  getRequestValue,
  getUsageFromResponses,
  openAIResponses,
  requireEnv,
} from "../lib/utils/spurgeonVectorUtils.js";
import { ExternalApiError, ValidationError } from "../lib/utils/routeUtils.js";

const DEFAULT_MODEL = "gpt-5";

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
};

export const restateSpurgeonQuestionService = async ({
  body = {},
  query = {},
}) => {
  const question =
    getRequestValue(body, query, "question") ??
    getRequestValue(body, query, "topic") ??
    getRequestValue(body, query, "query");
  const normalizedQuestion = normalizeString(question);
  if (!normalizedQuestion) {
    throw new ValidationError("Question or topic is required.");
  }

  const model = normalizeString(
    getRequestValue(body, query, "model") || DEFAULT_MODEL
  );

  requireEnv(["OPENAI_API_KEY"]);

  const system =
    "You rewrite question or topic into a concise, reverent, 19th-century sermon style. " +
    "Preserve intent, avoid new claims, and keep the question optimized for retrieval on a vector db index of Spurgeon sermons.";
  const user = JSON.stringify({ question: normalizedQuestion });

  const payload = await openAIResponses({ model, system, user });
  const text = extractResponseText(payload);
  if (!text) {
    throw new ExternalApiError("No text returned from model.", 502, {
      model,
    });
  }

  return {
    original: normalizedQuestion,
    restated: text,
    model,
    usage: getUsageFromResponses(payload),
  };
};
