# AI Agent Rules

## Project

Farmasi Digital (repo folder `digital-pharmacy`) — frontend-only prototype of a pharmacy POS + admin app modeled on
apotekdigital.id. Single `prototype/index.html` + `prototype/app.js`, vanilla JS, no backend, no build step.
All state lives in localStorage (seeded on first load). Every menu page is printable;
UI is bilingual (English / Indonesia).

## Source of Truth

.ai/AI_TASK.md is the only task file.

Always reconstruct state from .ai/AI_TASK.md, never from conversation history.

The user's Original Request inside it is immutable and authoritative.

## Rules Files

- Frontend / all code (`prototype/index.html`, `prototype/app.js`): read and follow .ai/AI_FE_RULES.md.
  That file is append-only; new FE rules are added there.
- No backend exists. .ai/AI_BE_RULES.md records the no-backend contract (storage,
  data model). Do not add servers, frameworks, or package managers.
- No deploy pipeline. .ai/AI_DEPLOYMENT_GUIDE.md only covers static hosting.

## Preserve User Input

Everything the user writes inside the Original Request section is immutable.
Never summarize, rewrite, shorten, or reformat it — including code, payloads,
file trees, and configuration. It must remain verbatim for the task lifetime.

## Task File Layout (fixed — from .ai/AI_TASK.example.md)

- `# Original Request` — verbatim user input; never modified after creation.
- `# Execution Plan` — checklist filled during Planning.
- `# Progress` — append findings as work happens (any file write resets the goal-loop stall counter).
- `# Verification` — commands + results.
- `# Task State` — Current Phase + step recovery info.

Never rename, reorder, or remove sections. Phases: `Planning`, `Waiting Approval`,
`Implementing`, `Verifying`, `Complete`, `Blocked`.

## New Task Detection

New task = user says "make goal"/"start" pointing at .ai/AI_TASK.md. When the file has a
filled Original Request and empty plan (`Current Phase: - Planning`):

1. Preserve the request verbatim.
2. Analyze the repository.
3. Fill the Execution Plan (implementation-oriented, grouped, concise).
4. Append findings to # Progress as you go.
5. Set `Current Phase: - Waiting Approval` and stop. No code changes during planning.

## Execution

After approval ("Approved"/"Proceed"/"Start"/"Continue"):

1. Execute all unchecked tasks without stopping between them.
2. Verify: `node --check prototype/app.js` and `node prototype/smoke.js`, browser click-through of every menu/button/print/language toggle; fix and repeat until green.
3. Update .ai/AI_TASK.md before/after milestones (task must survive session loss).
4. Set `Current Phase: - Complete` (or `Blocked` with blocker + required user action).

## Clarification Gate

If objective, requirements, expected behavior, or environment facts are unclear:
STOP, ask concise questions, do not guess, do not write code. Wrong confident answers
are worse than delayed progress. Conflicts between request and repository state →
stop, explain, ask which wins.

## Anti-Guessing / Evidence

Do not make technical claims without evidence — prefer repository code, official docs,
retrieved docs. State uncertainty when evidence is missing. Research unfamiliar
libraries/CLIs/APIs before coding with them. Prefer documented solutions over workarounds;
when a workaround is necessary, explain why.

## Infinite Loop Prevention

If the same failure repeats 3 cycles without progress, or reasoning runs long with no
file writes/findings: STOP, summarize, ask the user. If blocked: `Current Phase: Blocked`,
document blocker + required user action.

## Definition of Done

All plan items done · `node --check prototype/app.js` passes · `node prototype/smoke.js` passes · every menu opens, create/edit/save
updates its list, print opens a clean printout, EN/ID toggle works everywhere ·
no console errors · verification recorded in AI_TASK.md.
