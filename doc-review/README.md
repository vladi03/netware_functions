# Document Review Instructions

This folder defines the default AI document review behavior.

## Default Review (Always)
For every document review, AI should create a Markdown review file that checks and reports:
- Grammar issues
- Malapropisms (wrong word used in place of a similar-sounding correct word)
- Bad or awkward phrasing
- Parallelism issues (inconsistent grammatical structure in lists/sentences)
 - Do not make suggestions for smoothness or minor clarity in default review

## Detailed Review (Only if requested)
If the user explicitly requests a detailed review, include **Line Editing**:
- Focus on smoothness (flow)
- Focus on understanding (clarity)
- Review at sentence and paragraph level

## Publish Command Workflow
When the user prompts `publish <filename>`, AI should execute the full article publish workflow below.

### Input
- `<filename>` is expected in `doc-review/` (example: `doc-review/Torah_Mosaic_Report_Vlad_Martinez.docx`)

### Required Publish Steps
1. Extract article text from the source document.
2. Normalize encoding and punctuation so published text does not contain mojibake (for example `Godâ€™s` or `God�s`).
3. Save the cleaned article body as a text file in:
- `web/src/data/articles/<slug>.txt`
4. Add or update article metadata in:
- `web/src/data/articles.js`
5. Include:
- `slug`
- `title`
- `author`
- `published`
- `readingMinutes`
- `abstract` (4 to 8 sentences)
- `audioSrc` (static MP3 path)
- `body` import from `./articles/<slug>.txt?raw`
6. Generate narration once using OpenAI TTS and publish as a static file in:
- `web/public/audio/<slug>.mp3`
7. Ensure article page playback uses static `audioSrc` (no on-demand TTS generation).
8. Ensure article index displays the 4-8 sentence abstract.

### Output Convention
- Slug format: lowercase kebab-case
- Article route: `/article/<slug>`
- Audio route: `/audio/<slug>.mp3`
