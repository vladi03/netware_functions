import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { onRequest } from "firebase-functions/v2/https";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { checkCORS, isAuthPasscode } from "./lib/utils/routeUtils.js";
import { createSpurgeonMcpServer } from "./mcpServerFactory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const runtimeOptions = {
  timeoutSeconds: Number(process.env.SPURGEON_TIMEOUT_SECONDS ?? 540),
  memory: process.env.SPURGEON_MEMORY ?? "1GiB",
  minInstances: Number(process.env.MIN_INSTANCES ?? 0),
};

const transports = new Map();

const getHeaderValue = (headers, name) => {
  const value = headers?.[name];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const getSessionId = (req) => getHeaderValue(req.headers, "mcp-session-id");

const parseRequestBody = (req) => {
  if (req.body === undefined) {
    return { value: null, parseError: null };
  }
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return { value: req.body, parseError: null };
  }
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
  try {
    return { value: JSON.parse(raw), parseError: null };
  } catch (error) {
    return { value: raw, parseError: error };
  }
};

const isInitializationPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload.some((item) => isInitializeRequest(item));
  }
  return isInitializeRequest(payload);
};

const sendJsonRpcError = (res, status, code, message) => {
  res.status(status).json({
    jsonrpc: "2.0",
    error: { code, message },
    id: null,
  });
};

const createTransport = () => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      transports.set(sessionId, transport);
    },
    onsessionclosed: (sessionId) => {
      if (sessionId) {
        transports.delete(sessionId);
      }
    },
  });

  transport.onclose = () => {
    const sessionId = transport.sessionId;
    if (sessionId) {
      transports.delete(sessionId);
    }
  };

  transport.onerror = (error) => {
    console.error("MCP transport error:", error);
  };

  return transport;
};

const handlePost = async (req, res) => {
  const { value: parsedBody, parseError } = parseRequestBody(req);
  const sessionId = getSessionId(req);

  if (sessionId) {
    const transport = transports.get(sessionId);
    if (!transport) {
      sendJsonRpcError(res, 404, -32001, "Session not found");
      return;
    }
    await transport.handleRequest(req, res, parsedBody);
    return;
  }

  if (parseError || parsedBody === null) {
    sendJsonRpcError(res, 400, -32700, "Parse error: Invalid JSON");
    return;
  }

  if (!isInitializationPayload(parsedBody)) {
    sendJsonRpcError(res, 400, -32000, "Bad Request: No valid session ID provided");
    return;
  }

  const transport = createTransport();
  const server = createSpurgeonMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, parsedBody);
};

const handleGet = async (req, res) => {
  const sessionId = getSessionId(req);
  const transport = sessionId ? transports.get(sessionId) : null;

  if (!transport) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  await transport.handleRequest(req, res);
};

const handleDelete = async (req, res) => {
  const sessionId = getSessionId(req);
  const transport = sessionId ? transports.get(sessionId) : null;

  if (!transport) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  await transport.handleRequest(req, res);
};

const handleMcpRequest = async (req, res) => {
  switch (req.method) {
    case "POST":
      await handlePost(req, res);
      return;
    case "GET":
      await handleGet(req, res);
      return;
    case "DELETE":
      await handleDelete(req, res);
      return;
    default:
      res.status(405).json({ error: "Method not allowed." });
  }
};

const withCorsAndAuth = (handler) => async (req, res) => {
  await checkCORS(req, res, async () =>
    isAuthPasscode(req, res, async () => handler(req, res))
  );
};

export const spurgeonMcp = onRequest(runtimeOptions, withCorsAndAuth(handleMcpRequest));
