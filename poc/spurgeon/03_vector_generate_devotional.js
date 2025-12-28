import {
  loadEnv,
  requireEnv,
  openAIResponses,
  extractResponseText,
  getUsageFromResponses,
} from "./vector_utils.js";

async function generateDevotional({ question, excerpts, model = "gpt-5" }) {
  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }
  if (!Array.isArray(excerpts) || !excerpts.length) {
    throw new Error("Excerpts are required.");
  }

  loadEnv();
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
    question,
    excerpts,
  });

  const payload = await openAIResponses({ model, system, user });
  const text = extractResponseText(payload);
  if (!text) {
    throw new Error("No text returned from model.");
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Model output was not valid JSON: ${err.message}`);
  }

  return {
    devotional: parsed,
    usage: getUsageFromResponses(payload),
  };
}

export { generateDevotional };
