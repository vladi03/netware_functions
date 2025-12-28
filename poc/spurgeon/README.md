# Spurgeon Vector Scripts

This folder contains Node.js scripts for the Spurgeon vector QA workflow.

## Data

- Source: `s3://vladi-codex-transfer/spurgeon/sermons_by_verse/2025-11-01/sermon_bodies.ndjson`
- Place the file at `scripts/spurgeon/sermon_bodies.ndjson` (scripts load it from the current working directory).

## Files

- `03_vector_generate_devotional.js`: Calls OpenAI Responses to turn retrieved excerpts into a 500-word devotional JSON payload.
- `00_vector_qa_pipeline_orchestrator.js`: Orchestrates restating the question, vector search, and devotional generation, then writes a JSON result file.
- `02_vector_query_spurgeon.js`: Queries the S3 Vectors index with an embedding and builds excerpt context from sermon bodies.
- `01_vector_restate_question.js`: Restates a user question into a concise, reverent, 19th-century style for retrieval.
- `download_sermon_bodies.js`: Downloads the sermon bodies NDJSON file from S3 into the current folder.
- `vector_utils.js`: Shared helpers for env loading, OpenAI calls, and sermon body loading.
