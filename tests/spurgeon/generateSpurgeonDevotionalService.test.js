import assert from "assert/strict";
import { generateSpurgeonDevotionalService } from "../../functions/spurgeon-functions/server/generateSpurgeonDevotionalService.js";
import { loadSpurgeonEnv, writeResult } from "./utils/testUtils.js";

describe("generateSpurgeonDevotionalService", function () {
  this.timeout(180000);

  before(() => {
    loadSpurgeonEnv();
  });

  it("creates a devotional from excerpts", async () => {
    const request = {
      body: {
        question: "How do I persevere in prayer?",
        model: "gpt-5",
        excerpts: [
          {
            title: "Perseverance in Prayer",
            url: "https://example.com/sermon/123",
            excerpt:
              "Prayer is the breath of the believer, and perseverance in it " +
              "is the mark of a heart fixed on the promises of God.",
          },
          {
            title: "Waiting on the Lord",
            url: "https://example.com/sermon/456",
            excerpt:
              "He who waits upon the Lord shall renew his strength, for the " +
              "Lord delights in the soul that seeks Him with constancy.",
          },
        ],
      },
    };

    const response = await generateSpurgeonDevotionalService(request);

    assert.ok(response.devotional, "Expected devotional payload");
    assert.ok(response.devotional.title, "Expected devotional title");
    assert.ok(
      Array.isArray(response.devotional.paragraphs),
      "Expected paragraphs array"
    );

    writeResult("generateSpurgeonDevotional.json", {
      request: request.body,
      response,
    });
  });
});
