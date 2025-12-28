import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const getRepoRoot = () => {
  const utilsDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(utilsDir, "..", "..", "..");
};

const parseEnvValue = (value) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const loadSpurgeonEnv = () => {
  const repoRoot = getRepoRoot();
  const envPath = path.join(
    repoRoot,
    "functions",
    "spurgeon-functions",
    ".env"
  );
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env not found at ${envPath}`);
  }
  const contents = fs.readFileSync(envPath, "utf-8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const parts = line.split("=");
    const key = parts.shift().trim();
    const value = parseEnvValue(parts.join("="));
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

export const setSermonBodiesPath = () => {
  const repoRoot = getRepoRoot();
  const bodiesPath = path.join(
    repoRoot,
    "poc",
    "spurgeon",
    "sermon_bodies.ndjson"
  );
  process.env.SPURGEON_BODIES_PATH = bodiesPath;
  return bodiesPath;
};

export const writeResult = (filename, payload) => {
  const repoRoot = getRepoRoot();
  const resultsDir = path.join(repoRoot, "tests", "spurgeon", "results");
  fs.mkdirSync(resultsDir, { recursive: true });
  const outputPath = path.join(resultsDir, filename);
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  return outputPath;
};
