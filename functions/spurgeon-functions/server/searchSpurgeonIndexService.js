
import { S3VectorsClient, QueryVectorsCommand } from "@aws-sdk/client-s3vectors";
import { ValidationError } from "../lib/utils/routeUtils.js";
import {
  getRequestValue,
  getSermonBodiesMap,
  openAIEmbeddings,
  parseNumber,
  requireEnv,
} from "../lib/utils/spurgeonVectorUtils.js";

const DEFAULTS = {
  topK: 5,
  region: "us-east-2",
  bucket: "spurgeon",
  index: "sermon-bodies-v1",
  model: "text-embedding-3-small",
  contextChars: 200,
};

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
};

export const searchSpurgeonIndexService = async ({ body = {}, query = {} }) => {
  const question =
    getRequestValue(body, query, "question") ??
    getRequestValue(body, query, "query") ??
    getRequestValue(body, query, "topic");
  const normalizedQuestion = normalizeString(question);
  if (!normalizedQuestion) {
    throw new ValidationError("Question is required.");
  }

  const topK = parseNumber(
    getRequestValue(body, query, "topK"),
    DEFAULTS.topK,
    "topK"
  );
  if (!Number.isInteger(topK) || topK <= 0) {
    throw new ValidationError("topK must be a positive integer.");
  }

  const contextChars = parseNumber(
    getRequestValue(body, query, "contextChars"),
    DEFAULTS.contextChars,
    "contextChars"
  );
  if (!Number.isInteger(contextChars) || contextChars < 0) {
    throw new ValidationError("contextChars must be a non-negative integer.");
  }

  const region = normalizeString(
    getRequestValue(body, query, "region") || DEFAULTS.region
  );
  const bucket = normalizeString(
    getRequestValue(body, query, "bucket") || DEFAULTS.bucket
  );
  const index = normalizeString(
    getRequestValue(body, query, "index") || DEFAULTS.index
  );
  const model = normalizeString(
    getRequestValue(body, query, "model") || DEFAULTS.model
  );

  requireEnv(["OPENAI_API_KEY", "AWS_S3_KEY", "AWS_S3_SECRET"]);

  const { embedding, usage } = await openAIEmbeddings({
    model,
    input: normalizedQuestion,
  });

  const client = new S3VectorsClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_S3_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET,
    },
  });

  const command = new QueryVectorsCommand({
    vectorBucketName: bucket,
    indexName: index,
    topK,
    queryVector: { float32: embedding },
    returnMetadata: true,
    returnDistance: true,
  });

  const response = await client.send(command);
  const matches = response.vectors || response.matches || [];

  const bodiesPath =
    process.env.SPURGEON_BODIES_PATH || "sermon_bodies.ndjson";
  const bodyMap = await getSermonBodiesMap(bodiesPath);

  const results = matches.map((match) => {
    const meta = match.metadata || {};
    const sermonId = meta.sermon_id ? String(meta.sermon_id) : "";
    const body = sermonId ? bodyMap.get(sermonId) || "" : "";
    const offsetStart = Number(meta.offset_start || 0);
    const offsetEnd = Number(meta.offset_end || 0);
    const start = Math.max(0, offsetStart - contextChars);
    const end = Math.min(body.length, offsetEnd + contextChars);
    const excerpt = body ? body.slice(start, end) : "";
    return {
      key: match.key,
      distance: match.distance,
      title: meta.title,
      url: meta.url,
      sermon_id: sermonId,
      offset_start: offsetStart,
      offset_end: offsetEnd,
      excerpt,
    };
  });

  return {
    query: normalizedQuestion,
    results,
    usage,
  };
};
