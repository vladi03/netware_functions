# AGENTS

## Scope
Apply these instructions to all doc-review tasks in this repository.

## Default Review Behavior (Always)
For every document review request, create a new Markdown file with review findings.
Do not ask for this explicitly each time.

The review must check and report:
- Grammar issues
- Malapropisms (wrong word used in place of a similar-sounding correct word)
- Bad or awkward phrasing
- Parallelism issues (inconsistent grammatical structure)

Do not include smoothness or minor clarity suggestions in default review unless the user explicitly asks for a detailed review.

## Detailed Review
Only when the user explicitly requests a detailed review, include line-level and paragraph-level editing focused on:
- Flow and readability
- Sentence-level clarity

## Source of Record
For document-review workflow details (including publish command behavior), follow `doc-review/README.md`.

## Default Review Output Location
- Write review markdown to `doc-review/reviews/<slug>.md` (or `<filename>-review.md` if no slug is provided).

## Review File Synchronization
- All review results must be reflected in the review markdown file.
- Keep the markdown file as the current source of truth for open issues.

## Re-Check Commands
- When the user says `check now` or `check again`, re-check the source document against the current review markdown file.
- Remove items that have been fixed from the markdown file.
- Add newly discovered issues to the markdown file and mark them with `NEW`.

## Commit And Push Behavior
- If the user requests `commit` or `commit and push`, proceed without asking follow-up permission.
- Use multiple commits when it improves organization.
- By default, commit only files changed for the requested task.
- Do not block on unrelated modified files in the working tree; leave them untouched unless the user explicitly asks to include them.
