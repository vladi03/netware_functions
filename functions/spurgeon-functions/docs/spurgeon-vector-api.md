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
