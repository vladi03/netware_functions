# chatSpurgeonService performance review

## Evaluation (what happens per request)
- Casual: OpenAI classify -> OpenAI response. Still two network calls before the reply.
- Inappropriate: OpenAI classify -> short local reply.
- Theological/create_devotional (most cases): OpenAI classify -> OpenAI topK selection -> MCP session init -> MCP tool call (OpenAI embeddings + S3 vector query + sermon body lookup) -> OpenAI response -> MCP close. That is 4 external API calls plus MCP overhead in series.

## Why it feels slow even with gpt-5-nano
- The slowest work is not the final response model. The vector search path always runs an embeddings request (`text-embedding-3-small`) and an S3 vector query, and it can also load a 122MB sermon bodies file on cold start.
- There are two extra OpenAI calls before the actual answer (classification and topK). Even with nano, those add round-trip latency.
- The MCP client is created per request, which adds an initialize/close HTTP round-trip and may hit a separate Cloud Function instance (extra cold starts).

## Recommendations with estimated time savings (per request)
Estimates assume warm instances and typical network conditions. Cold starts can add 0.5-3s on top.

1) Replace LLM topK selection with a fixed value or simple heuristic.
   - Change: remove `selectSearchTopK` call; use constant `topK = 3` or a length-based rule.
   - Est. savings: ~200-600ms (one OpenAI call).
   - Trade-off: slightly less adaptive recall, usually acceptable for speed.
   [Instructions: Do not have AI set topK]

2) Use a dedicated small model for classification/topK (even when final model is larger).
   - Change: `CLASSIFICATION_MODEL = "gpt-5-nano"` (or smaller), pass it to classify/topK.
   - Est. savings: ~200-800ms when the chat model is `gpt-5` or larger.
   - Trade-off: marginally less accurate routing, but still robust with a strict JSON schema.
   [Instructions: MAKE classification `gpt-5-nano` and `topK = 2` for theological  classification. USE `topK = 3` for create_devotional]

3) Combine classification + topK into a single OpenAI call.
   - Change: ask for JSON with both `category` and `topK`.
   - Est. savings: ~200-600ms vs two separate calls.
   - Trade-off: slightly more prompt complexity.
   [Instructions: Do not have AI set topK]

4) Avoid MCP overhead by calling the search service directly (same process).
   - Change: call `searchSpurgeonIndexService` from `chatSpurgeonService` instead of MCP for the search step.
   - Est. savings: ~150-400ms and fewer cold starts (no separate MCP function).
   - Trade-off: you lose the uniform MCP tool interface for that path.
   [Instructions: do it.  call `searchSpurgeonIndexService` from `chatSpurgeonService`]

5) Cache search results or embeddings for repeated questions.
   - Change: LRU cache keyed by normalized question (and topK).
   - Est. savings: ~300-1200ms on cache hits (skips embeddings + S3).
   - Trade-off: higher memory usage; cache invalidation is simple because data is static.
   [Instructions: NO. DO NOTHING on this.]

6) Cap and trim inputs to reduce token processing.
   - Change: limit history length (last N turns) and strip search output fields to only `title`, `url`, and `excerpt`. Optionally add `max_output_tokens` to responses.
   - Est. savings: ~50-300ms (varies with history length).
   - Trade-off: slightly less context.
   [Instructions: strip search output fields to only `title`, `url`, `sermon_id`, and `excerpt`]

7) If latency matters more than cost, speculate the search in parallel with classification.
   - Change: kick off search immediately, cancel/ignore if classification is casual/inappropriate.
   - Est. savings: ~200-800ms for the common theological path.
   - Trade-off: wasted search cost for non-theological messages.
   [Instructions: search in parallel with classification]

## Expected best-case path after quick wins
If you apply #1 and #3 (or #1 + #2), the theological path becomes:
OpenAI classify -> search -> OpenAI response (plus embeddings/S3). That removes one OpenAI call and reduces overall latency by ~0.2-0.6s.

If you also apply #4, you remove the MCP init/close round-trip and avoid a second cold start, saving ~0.15-0.4s warm (and often more when cold).
