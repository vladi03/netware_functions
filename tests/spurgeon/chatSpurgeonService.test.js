import assert from "assert/strict";
import { chatSpurgeonService } from "../../functions/spurgeon-functions/server/chatSpurgeonService.js";
import { loadSpurgeonEnv, writeResult } from "./utils/testUtils.js";

describe("chatSpurgeonService", function () {
  this.timeout(180000);

  before(() => {
    loadSpurgeonEnv();
    if (!process.env.SPURGEON_MCP_URL) {
      throw new Error("SPURGEON_MCP_URL is required for chatSpurgeonService tests.");
    }
  });

  it("returns a Spurgeon-style reply", async () => {
    const request = {
      body: {
        message: "How do I persevere in prayer?",
        model: "gpt-5",
        temperature: 0.7,
      },
    };

    const response = await chatSpurgeonService(request);

    assert.ok(response.reply, "Expected reply text");
    assert.ok(Array.isArray(response.tool_runs), "Expected tool_runs array");

    writeResult("chatSpurgeon.json", {
      request: request.body,
      response,
    });
  });
});
