# Spurgeon Vector Service Task

Goal: Convert the POC vector scripts into Firebase function services and routes.

Checklist:
- [x] Move shared OpenAI + vector helpers into `lib/utils`.
- [x] Create a restate question service for `01_vector_restate_question.js`.
- [x] Update `searchSpurgeonIndexService.js` to use `02_vector_query_spurgeon.js`.
- [x] Create a devotional service for `03_vector_generate_devotional.js`.
- [x] Wire all services in `spurgeonRoute.js`.
- [x] Document the endpoints with curl examples.
