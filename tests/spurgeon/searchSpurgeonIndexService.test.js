import assert from "assert/strict";
import { searchSpurgeonIndexService } from "../../functions/spurgeon-functions/server/searchSpurgeonIndexService.js";
import {
  loadSpurgeonEnv,
  setSermonBodiesPath,
  writeResult,
} from "./utils/testUtils.js";

describe("searchSpurgeonIndexService", function () {
  this.timeout(180000);

  before(() => {
    loadSpurgeonEnv();
    setSermonBodiesPath();
  });

  it("queries the vector index and returns excerpts", async () => {
    const request = {
      body: {
        question: "How do I persevere in prayer?",
        topK: 3,
        contextChars: 120,
      },
    };

    const response = await searchSpurgeonIndexService(request);

    assert.equal(response.query, request.body.question);
    assert.ok(Array.isArray(response.results), "Expected results array");
    if (response.results.length) {
      assert.ok(
        typeof response.results[0].excerpt === "string",
        "Expected excerpt text"
      );
    }

    writeResult("searchSpurgeonIndex.json", {
      request: request.body,
      response,
    });
  });
});
