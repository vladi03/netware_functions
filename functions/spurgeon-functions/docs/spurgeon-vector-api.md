# Spurgeon Vector API

All endpoints require the admin passcode via `Authorization: Bearer <PASSCODES_ADMIN>`.

Base URLs:
- Local emulator: `http://127.0.0.1:5005/netware-326600/us-central1`
- Cloud: `https://us-central1-netware-326600.cloudfunctions.net`

Environment requirements:
- `PASSCODES_ADMIN`
- `OPENAI_API_KEY`
- `AWS_S3_KEY`
- `AWS_S3_SECRET`
- `SPURGEON_BODIES_PATH` (optional, defaults to `sermon_bodies.ndjson` in the functions root)
- `SPURGEON_MCP_URL` (required for `spurgeonFunctions-chat`, points to the `spurgeonMcp` endpoint)

## MCP Endpoint (Streamable HTTP)

MCP is exposed via the Firebase function `spurgeonMcp`. It uses the Streamable HTTP transport over `GET`, `POST`, and `DELETE` to manage MCP sessions. All MCP requests must include the admin passcode header.

Endpoint:
- Local emulator: `http://127.0.0.1:5005/netware-326600/us-central1/spurgeonMcp`
- Cloud: `https://us-central1-netware-326600.cloudfunctions.net/spurgeonMcp`

Required headers:
- `Authorization: Bearer <PASSCODES_ADMIN>`
- `Accept: application/json, text/event-stream` for `POST`
- `Accept: text/event-stream` for `GET`
- `Content-Type: application/json` for `POST`
- `Mcp-Protocol-Version: 2025-03-26` for non-initialize requests
- `Mcp-Session-Id` for non-initialize requests (returned in the initialize response)

Notes:
- Cloud Functions instances are stateless; MCP sessions are in-memory and can break if requests land on different instances.
- For production MCP, Cloud Run is more reliable.

Initialize curl (local emulator):
```bash
curl -X POST "http://127.0.0.1:5005/netware-326600/us-central1/spurgeonMcp" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2025-03-26\",\"capabilities\":{},\"clientInfo\":{\"name\":\"curl\",\"version\":\"0.1.0\"}}}"
```

## POST spurgeonFunctions-restateSpurgeonQuestion

Restates a question into a 19th-century Spurgeon-style retrieval query.

Request JSON:
```json
{
  "question": "How do I persevere in prayer?",
  "model": "gpt-5"
}
```

Local curl:
```bash
curl -X POST "http://127.0.0.1:5005/netware-326600/us-central1/spurgeonFunctions-restateSpurgeonQuestion" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"How do I persevere in prayer?\",\"model\":\"gpt-5\"}"
```

Cloud curl:
```bash
curl -X POST "https://us-central1-netware-326600.cloudfunctions.net/spurgeonFunctions-restateSpurgeonQuestion" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"How do I persevere in prayer?\",\"model\":\"gpt-5\"}"
```

Response JSON (example):
```json
{
  "original": "How do I persevere in prayer?",
  "restated": "How may a weary soul continue steadfast in prayer?",
  "model": "gpt-5",
  "usage": {
    "input_tokens": 123,
    "cached_input_tokens": 0,
    "output_tokens": 45,
    "total_tokens": 168
  }
}
```

## POST spurgeonFunctions-searchSpurgeon

Queries the Spurgeon S3 vectors index with an embedding and returns excerpts.

Request JSON:
```json
{
  "question": "How do I persevere in prayer?",
  "topK": 5,
  "contextChars": 200,
  "region": "us-east-2",
  "bucket": "spurgeon",
  "index": "sermon-bodies-v1",
  "model": "text-embedding-3-small"
}
```

Local curl:
```bash
curl -X POST "http://127.0.0.1:5005/netware-326600/us-central1/spurgeonFunctions-searchSpurgeon" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"How do I persevere in prayer?\",\"topK\":5,\"contextChars\":200}"
```

Cloud curl:
```bash
curl -X POST "https://us-central1-netware-326600.cloudfunctions.net/spurgeonFunctions-searchSpurgeon" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"How do I persevere in prayer?\",\"topK\":5,\"contextChars\":200}"
```

Response JSON (example):
```json
{
  "query": "How do I persevere in prayer?",
  "results": [
    {
      "key": "sermons/123",
      "distance": 0.1123,
      "title": "Perseverance in Prayer",
      "url": "https://example.com/sermon/123",
      "sermon_id": "123",
      "offset_start": 1200,
      "offset_end": 1330,
      "excerpt": "Prayer is the breath of the believer..."
    }
  ],
  "usage": {
    "input_tokens": 45,
    "cached_input_tokens": 0,
    "output_tokens": 0,
    "total_tokens": 45
  }
}
```

## POST spurgeonFunctions-generateSpurgeonDevotional

Generates a 500-word devotional from the retrieved excerpts.

Request JSON:
```json
{
  "question": "How do I persevere in prayer?",
  "model": "gpt-5",
  "excerpts": [
    {
      "title": "Perseverance in Prayer",
      "url": "https://example.com/sermon/123",
      "excerpt": "Prayer is the breath of the believer..."
    }
  ]
}
```

## POST spurgeonFunctions-chat

Chat endpoint that speaks in Spurgeon’s voice and can orchestrate MCP tools.

Request JSON:
```json
{
  "message": "How do I persevere in prayer?",
  "history": [
    { "role": "user", "content": "Hello." },
    { "role": "assistant", "content": "Peace be unto you." }
  ],
  "model": "gpt-5",
  "temperature": 0.7
}
```

Local curl:
```bash
curl -X POST "http://127.0.0.1:5005/netware-326600/us-central1/spurgeonFunctions-chat" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"How do I persevere in prayer?\",\"model\":\"gpt-5\"}"
```

Cloud curl:
```bash
curl -X POST "https://us-central1-netware-326600.cloudfunctions.net/spurgeonFunctions-chat" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"How do I persevere in prayer?\",\"model\":\"gpt-5\"}"
```

Response JSON (example):
```json
{
  "reply": "Beloved, perseverance in prayer is not the strength of your arm but the steadfastness of your faith...",
  "model": "gpt-5",
  "usage": {
    "input_tokens": 512,
    "cached_input_tokens": 0,
    "output_tokens": 210,
    "total_tokens": 722
  },
  "tool_runs": [
    {
      "name": "spurgeon.search",
      "arguments": { "question": "How do I persevere in prayer?" },
      "output": {
        "query": "How do I persevere in prayer?",
        "results": []
      },
      "isError": false
    }
  ]
}
```

Local curl:
```bash
curl -X POST "http://127.0.0.1:5005/netware-326600/us-central1/spurgeonFunctions-generateSpurgeonDevotional" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"How do I persevere in prayer?\",\"excerpts\":[{\"title\":\"Perseverance in Prayer\",\"url\":\"https://example.com/sermon/123\",\"excerpt\":\"Prayer is the breath of the believer...\"}]}"
```

Cloud curl:
```bash
curl -X POST "https://us-central1-netware-326600.cloudfunctions.net/spurgeonFunctions-generateSpurgeonDevotional" \
  -H "Authorization: Bearer <PASSCODES_ADMIN>" \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"How do I persevere in prayer?\",\"excerpts\":[{\"title\":\"Perseverance in Prayer\",\"url\":\"https://example.com/sermon/123\",\"excerpt\":\"Prayer is the breath of the believer...\"}]}"
```

Response JSON (example):
```json
{
  "devotional": {
    "title": "Steadfast at the Mercy Seat",
    "intro": "Prayer draws the believer into the promises of Christ...",
    "paragraphs": [
      "The Lord calls His people to persist in prayer...",
      "Perseverance is not stubbornness but faith..."
    ],
    "references": [
      {
        "title": "Perseverance in Prayer",
        "url": "https://example.com/sermon/123"
      }
    ]
  },
  "model": "gpt-5",
  "usage": {
    "input_tokens": 256,
    "cached_input_tokens": 0,
    "output_tokens": 612,
    "total_tokens": 868
  }
}
```
