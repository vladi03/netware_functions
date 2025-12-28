import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import { createErrorResponse } from "./lib/utils/routeUtils.js";
import { searchSpurgeonIndexService } from "./server/searchSpurgeonIndexService.js";
import { restateSpurgeonQuestionService } from "./server/restateSpurgeonQuestionService.js";
import { generateSpurgeonDevotionalService } from "./server/generateSpurgeonDevotionalService.js";

const formatToolResult = (payload) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(payload, null, 2),
    },
  ],
  structuredContent: payload,
});

const formatToolError = (error) => {
  const { status, body } = createErrorResponse(error);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ status, ...body }, null, 2),
      },
    ],
    isError: true,
  };
};

const createServiceTool = (service) => async (args = {}) => {
  const body = args && typeof args === "object" ? args : {};
  try {
    const payload = await service({ body, query: {} });
    return formatToolResult(payload);
  } catch (error) {
    return formatToolError(error);
  }
};

const stringField = (description) => z.string().optional().describe(description);
const numberField = (description) =>
  z.union([z.number(), z.string()]).optional().describe(description);

export const createSpurgeonMcpServer = () => {
  const server = new McpServer({
    name: "spurgeon-functions-mcp",
    version: "1.0.0",
    description: "MCP tools for Spurgeon vector search and devotional generation.",
  });

  server.registerTool(
    "spurgeon.search",
    {
      title: "Search Spurgeon Index",
      description:
        "Query the Spurgeon vector index. Provide one of question, query, or topic.",
      inputSchema: {
        question: stringField("Natural language question."),
        query: stringField("Alternate key for question."),
        topic: stringField("Alternate key for question."),
        topK: numberField("Number of results to return (default 5)."),
        contextChars: numberField(
          "Extra context chars around the hit (default 200)."
        ),
        region: stringField("AWS region (default us-east-2)."),
        bucket: stringField("S3 vector bucket (default spurgeon)."),
        index: stringField("Vector index name (default sermon-bodies-v1)."),
        model: stringField("Embedding model (default text-embedding-3-small)."),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    createServiceTool(searchSpurgeonIndexService)
  );

  server.registerTool(
    "spurgeon.restate",
    {
      title: "Restate Spurgeon Question",
      description:
        "Restate a question into a concise 19th-century retrieval query.",
      inputSchema: {
        question: stringField("Natural language question."),
        query: stringField("Alternate key for question."),
        topic: stringField("Alternate key for question."),
        model: stringField("Responses model (default gpt-5)."),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    createServiceTool(restateSpurgeonQuestionService)
  );

  server.registerTool(
    "spurgeon.devotional",
    {
      title: "Generate Spurgeon Devotional",
      description:
        "Generate a 500-word devotional from excerpts. Excerpts should be an array of {title,url,excerpt}.",
      inputSchema: {
        question: stringField("Natural language question."),
        query: stringField("Alternate key for question."),
        topic: stringField("Alternate key for question."),
        model: stringField("Responses model (default gpt-5)."),
        excerpts: z
          .array(z.any())
          .min(1)
          .describe("Array of excerpts used to write the devotional."),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    createServiceTool(generateSpurgeonDevotionalService)
  );

  return server;
};
