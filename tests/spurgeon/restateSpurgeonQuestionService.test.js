import assert from "assert/strict";
import { restateSpurgeonQuestionService } from "../../functions/spurgeon-functions/server/restateSpurgeonQuestionService.js";
import { loadSpurgeonEnv, writeResult } from "./utils/testUtils.js";

describe("restateSpurgeonQuestionService", function () {
  this.timeout(180000);

  before(() => {
    loadSpurgeonEnv();
  });

  it("restates a question into Spurgeon-style language", async () => {
    const request = {
      body: {
        question: "How do I persevere in prayer?",
        model: "gpt-5",
      },
    };

    const response = await restateSpurgeonQuestionService(request);

    assert.ok(response.restated, "Expected restated text");
    assert.equal(response.original, request.body.question);

    writeResult("restateSpurgeonQuestion.json", {
      request: request.body,
      response,
    });
  });
});
