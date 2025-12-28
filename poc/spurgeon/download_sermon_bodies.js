import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import {
  S3Client,
  GetObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { loadEnv, requireEnv } from "./vector_utils.js";

const DEFAULT_S3_URI =
  "s3://vladi-codex-transfer/spurgeon/sermons_by_verse/2025-11-01/sermon_bodies.ndjson";

function parseArgs(argv) {
  const args = {
    s3Uri: DEFAULT_S3_URI,
    outPath: "sermon_bodies.ndjson",
    region:
      process.env.AWS_S3_REGION ||
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      "us-east-2",
  };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--s3-uri") {
      args.s3Uri = argv[i + 1] || args.s3Uri;
      i += 1;
    } else if (token === "--out") {
      args.outPath = argv[i + 1] || args.outPath;
      i += 1;
    } else if (token === "--region") {
      args.region = argv[i + 1] || args.region;
      i += 1;
    }
  }
  return args;
}

function parseS3Uri(uri) {
  if (!uri.startsWith("s3://")) {
    throw new Error(`Invalid S3 URI: ${uri}`);
  }
  const withoutScheme = uri.slice("s3://".length);
  const slashIndex = withoutScheme.indexOf("/");
  if (slashIndex <= 0 || slashIndex === withoutScheme.length - 1) {
    throw new Error(`Invalid S3 URI: ${uri}`);
  }
  return {
    bucket: withoutScheme.slice(0, slashIndex),
    key: withoutScheme.slice(slashIndex + 1),
  };
}

async function main() {
  loadEnv();
  requireEnv(["AWS_S3_KEY", "AWS_S3_SECRET"]);

  const { s3Uri, outPath, region } = parseArgs(process.argv);
  const { bucket, key } = parseS3Uri(s3Uri);

  const credentials = {
    accessKeyId: process.env.AWS_S3_KEY,
    secretAccessKey: process.env.AWS_S3_SECRET,
  };

  async function fetchObject(targetRegion) {
    const client = new S3Client({
      region: targetRegion,
      credentials,
    });
    return client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  }

  async function resolveBucketRegion(initialRegion) {
    const client = new S3Client({
      region: initialRegion,
      credentials,
    });
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
      return initialRegion;
    } catch (err) {
      const headers = err?.$metadata?.httpHeaders || {};
      const bucketRegion =
        headers["x-amz-bucket-region"] || err?.BucketRegion;
      if (bucketRegion) {
        return bucketRegion;
      }
      throw err;
    }
  }

  const bucketRegion = await resolveBucketRegion(region);
  const response = await fetchObject(bucketRegion);

  if (!response.Body) {
    throw new Error(`No body returned for ${s3Uri}`);
  }

  const resolvedOut = path.resolve(outPath);
  await pipeline(response.Body, fs.createWriteStream(resolvedOut));
  console.log(resolvedOut);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
