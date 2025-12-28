import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createSpurgeonMcpServer } from "./mcpServerFactory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const server = createSpurgeonMcpServer();

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Spurgeon MCP server running on stdio.");
};

main().catch((error) => {
  console.error("MCP server error:", error);
  process.exit(1);
});
