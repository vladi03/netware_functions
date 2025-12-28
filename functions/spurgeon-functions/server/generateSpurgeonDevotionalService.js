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

export const generateSpurgeonDevotionalService = async ({
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

  const excerpts = getRequestValue(body, query, "excerpts");
  if (!Array.isArray(excerpts) || !excerpts.length) {
    throw new ValidationError("Excerpts are required.");
  }

  const model = normalizeString(
    getRequestValue(body, query, "model") || DEFAULT_MODEL
  );

  requireEnv(["OPENAI_API_KEY"]);

  const rewriteInstruction =
    "Rewrite the following material into a cohesive article that presents the ideas directly, " +
    "without mentioning the author or referring to the author (e.g., 'the author says,' " +
    "'he argues,' 'Spurgeon treats...'). The result should read as if the ideas are being stated " +
    "directly (e.g., 'John 3:16 teaches...,' 'This promise shows...'), not as quotations or " +
    "commentary on another writer.";

  const system =
    "You write a 500-word devotional using only the provided excerpts. " +
    "Return JSON only with fields: title, intro, paragraphs (array), references (array of {title,url}). " +
    "Do not include markdown or extra keys. " +
    rewriteInstruction;

  const user = JSON.stringify({
    question: normalizedQuestion,
    excerpts,
  });

  const payload = await openAIResponses({ model, system, user });
  const text = extractResponseText(payload);
  if (!text) {
    throw new ExternalApiError("No text returned from model.", 502, {
      model,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ExternalApiError("Model output was not valid JSON.", 502, {
      error: error.message,
      sample: text.slice(0, 500),
    });
  }

  return {
    devotional: parsed,
    model,
    usage: getUsageFromResponses(payload),
  };
};
