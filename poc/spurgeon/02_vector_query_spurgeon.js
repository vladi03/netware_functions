import path from "path";
import {
  loadEnv,
  requireEnv,
  readSermonBodiesMap,
  openAIEmbeddings,
} from "./vector_utils.js";
import { S3VectorsClient, QueryVectorsCommand } from "@aws-sdk/client-s3vectors";

async function queryVectors({
  question,
  topK = 5,
  region = "us-east-2",
  bucket = "spurgeon",
  index = "sermon-bodies-v1",
  model = "text-embedding-3-small",
  contextChars = 200,
}) {
  if (!question || !question.trim()) {
    throw new Error("Question is required.");
  }

  loadEnv();
  requireEnv(["OPENAI_API_KEY", "AWS_S3_KEY", "AWS_S3_SECRET"]);

  const { embedding, usage } = await openAIEmbeddings({ model, input: question });

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

  const bodiesPath = path.resolve("sermon_bodies.ndjson");
  const bodyMap = await readSermonBodiesMap(bodiesPath);

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
      offset_start: offsetStart,
      offset_end: offsetEnd,
      excerpt,
    };
  });

  return {
    query: question,
    results,
    usage,
  };
}

export { queryVectors };
