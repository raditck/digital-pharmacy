# Goal-Loop Setup Guide

A self-driving loop for pi that keeps your project moving toward a defined goal in `.ai/AI_TASK.md`, even across API hiccups, empty responses, and budget timeouts. Two pieces: a tiny extension (the engine) and a task file (the steering wheel).

**The task file is ALWAYS in tracked mode** — the layout from `.ai/AI_TASK.example.md` exists from the very first line of a task, so the loop can parse `Current Phase` at any moment, including before a plan exists.

---

## 1. Install the extension

Create `.pi/extensions/goal-loop.ts` in your project root:

```ts
// .pi/extensions/goal-loop.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const TASK_FILE = join(process.cwd(), '.ai/AI_TASK.md');
const TERMINAL = new Set(['complete', 'blocked', 'waiting approval']);
const MAX_STALL = 10; // planning writes files rarely — higher ceiling than implement loops
const MAX_QUEUED = 1; // never let more than this many nudges sit unsent

let stall = 0;
let lastContent: string | null = null;
let pendingNudges = 0; // pi only exposes hasPendingMessages(), not a count

const currentPhase = (): string | null => {
  try {
    const m = readFileSync(TASK_FILE, 'utf8').match(/Current Phase:\s*\n?\s*-\s*(.+)/i);
    return m ? m[1].trim().toLowerCase() : null;
  } catch {
    return null;
  }
};

const showQueue = (ctx: any) => {
  ctx?.ui?.setStatus?.('goal-loop', pendingNudges > 0 ? `queued: ${pendingNudges}` : '');
};

const nudgeText = (phase: string): string => {
  if (phase === 'planning') {
    return (
      '[goal-loop] Planning not yet finished (.ai/AI_TASK.md phase: planning). ' +
      'Re-read .ai/AI_TASK.md and the request, verify repository state, and finish the plan: ' +
      'fill the Execution Plan, APPEND findings to # Progress as you go (any file write resets ' +
      'the stall counter), then set Current Phase: Waiting Approval and stop. ' +
      'Do not modify code during planning.'
    );
  }
  return (
    '[goal-loop] Goal not yet achieved (.ai/AI_TASK.md phase: ' +
    phase +
    '). Re-read .ai/AI_TASK.md, verify repository state, and continue ' +
    'from the first incomplete step. Do not ask for permission ' +
    'between steps.'
  );
};

export default function (pi: any) {
  if (process.env.PI_SUBAGENT_CHILD === '1') return;

  // agent_settled (not agent_end) only fires once pi is truly done and
  // won't auto-continue on its own (retries / auto-compaction don't count).
  pi.on('agent_settled', (_event: any, ctx: any) => {
    if (pendingNudges >= MAX_QUEUED) {
      showQueue(ctx);
      return;
    }

    let content: string | null = null;
    try {
      content = readFileSync(TASK_FILE, 'utf8');
    } catch {
      return;
    }
    if (content !== lastContent) {
      stall = 0;
      lastContent = content;
    }
    const phase = currentPhase();
    if (!phase || TERMINAL.has(phase) || stall >= MAX_STALL) return;

    stall += 1;
    pendingNudges += 1;
    showQueue(ctx);
    pi.sendUserMessage(nudgeText(phase), { deliverAs: 'followUp' });
  });

  pi.on('agent_start', (_event: any, ctx: any) => {
    stall = 0;
    if (pendingNudges > 0) pendingNudges -= 1; // this run consumed one
    showQueue(ctx);
  });
}
```

The extension runs automatically — pi discovers any `.ts` file in `.pi/extensions/` at startup.

---

## 2. Create `.ai/AI_TASK.md` — copy the example, paste the request

Start every task from `.ai/AI_TASK.example.md` (copy it, then paste your request verbatim into `# Original Request`):

```markdown
# Original Request

(paste your request verbatim — do not summarize, do not reformat)

# Execution Plan

- [ ] (empty — filled by the agent during Planning)

# Progress

(notes)

# Verification

(pending)

# Task State

Current Phase:

- Planning
```

The template embeds the planning contract: fill the plan → append findings to `# Progress` as you go → set `Current Phase: - Waiting Approval` → stop. No top-level `NEW TASK` marker — it is deprecated (it used to make every resume wipe progress).

### Phases the loop understands

| Phase              | Loop behavior                                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `Planning`         | nudges with the planning nudge (finish plan → note Progress → Waiting Approval)                                    |
| `Waiting Approval` | **stops** (terminal — the plan is ready, you reply `approved` when ready)                                          |
| `Implementing`     | nudges with the execution nudge (continue from first incomplete step)                                              |
| `Verifying`        | nudges with the execution nudge                                                                                    |
| `Complete`         | **stops** (terminal)                                                                                              |
| `Blocked`          | **stops** (terminal — you take over)                                                                              |

To **stop the loop**, the agent (or you) writes one of the terminal phases into `# Task State`.

---

## 3. Surviving provider failures (the part you asked for)

The default pi retry + your goal-loop together recover from most transient API failures **without any extra configuration**:

1. **Network blip / 5xx / 524** → pi's built-in agent retry (`retry.enabled` in `~/.pi/agent/settings.json`, defaults to 3 attempts with 2s→4s→8s backoff) re-fires the request.
2. **Empty response / 524 with no body** → pi reports the error and the turn ends. The loop fires its continuation on `agent_settled`, the parent session re-sends the work, the next attempt may succeed.
3. **Model timeout / budget exceeded** → the turn ends with an error. Loop fires, you get a fresh turn. Stall counter protects against infinite no-progress cycles.
4. **Process death / IDE restart** → state lives in `.ai/AI_TASK.md` on disk. The next session re-reads it and resumes from the recorded `Last Completed Step` / `Next Step`.

### The stall counter (why planning used to die silently)

The loop only keeps nudging while `.ai/AI_TASK.md` keeps changing (any byte change resets `stall`). Planning rarely writes files — findings live in the model's head — so a planning phase used to hit `MAX_STALL` unchanged turns and the loop went quiet mid-plan. Two countermeasures, both now standard:

1. **The planning contract** (`AI_TASK.example.md` + agent rules): the agent appends analysis findings to `# Progress` as it works — every write resets the counter.
2. **`MAX_STALL = 10`** — a higher ceiling for low-write phases.

If you still see a silent stop in a low-write phase, raise `MAX_STALL` further or make the phase write more.

### Optional belt-and-suspenders: surface persistent provider failures

If you want the loop to **block** instead of retrying indefinitely when the model itself is consistently broken, add a tiny watchdog. Create `.pi/extensions/provider-watchdog.ts`:

```ts
// .pi/extensions/provider-watchdog.ts
import { readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const LOG = join(process.cwd(), 'storage', 'logs', 'provider-failures.log');
const THRESHOLD = 3; // consecutive turn-level errors
const WINDOW_MS = 5 * 60_000; // within 5 minutes

let errors: number[] = [];

export default function (pi: any) {
  const recordFailure = (label: string) => {
    const now = Date.now();
    errors = errors.filter((t) => now - t < WINDOW_MS);
    errors.push(now);
    try {
      appendFileSync(LOG, `[${new Date().toISOString()}] ${label}\n`);
    } catch {}
    if (errors.length >= THRESHOLD) {
      try {
        const t = readFileSync(join(process.cwd(), '.ai/AI_TASK.md'), 'utf8');
        if (!/Current Phase:\s*\n?\s*-\s*Blocked/i.test(t)) {
          const blocked = t.replace(
            /(# Task State[\s\S]*?Current Phase:\s*\n?\s*-\s*)(.+)/i,
            '$1Blocked',
          );
          // Atomic-ish: write to a temp then rename would be safer; for the
          // goal-loop use case a direct write is acceptable since the loop
          // treats Blocked as terminal and stops immediately.
          const { writeFileSync } = require('node:fs');
          writeFileSync(join(process.cwd(), '.ai/AI_TASK.md'), blocked);
        }
      } catch {}
    }
  };

  // pi fires this on tool failures; we only care about model/route failures.
  pi.on('tool_error', (event: any) => {
    if (event?.error?.status >= 500) recordFailure('tool 5xx');
  });
  pi.on('session_error', (event: any) => recordFailure('session error'));
}
```

Then add a matching step in your `.ai/AI_TASK.md`:

- When `Current Phase: Blocked` appears, the goal-loop halts immediately and you (the human) take over.

---

## 4. Optional: combine with subagents

If you also want Worker / Reviewer / Scout agents in project B:

1. Install pi-subagents: `pi install npm:pi-subagents` (one-time, global).
2. In your prompts, ask the parent session to launch them: `Use worker to implement this, then reviewer to check.`
3. Keep the `PI_SUBAGENT_CHILD === "1"` guard in `goal-loop.ts` — children must never self-nudge.
4. The parent loop will still nudge the orchestrator to keep going through subagent failures, just like in this project.

---

## 5. Tuning checklist (edit the extension file)

| Knob                                | Default                                   | When to change                                                      |
| ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `TERMINAL` set                      | `complete`, `blocked`, `waiting approval` | add/remove phases you treat as terminal                             |
| `MAX_STALL`                         | 10                                        | raise for long low-write phases; lower to 2 for tight scope         |
| `deliverAs: "followUp"`             | queued until turn ends                    | switch to `"steer"` to interrupt mid-stream                         |
| `pi.on("agent_start")` resets stall | true                                      | keep — manual user input always counts as progress                  |
| `nudgeText()`                       | phase-aware (planning vs execution)       | extend when adding new non-terminal phases                          |

---

## 6. Quick smoke test

1. `cd project-b && pi`
2. Copy `.ai/AI_TASK.example.md` → `.ai/AI_TASK.md`, paste a sample request, keep `Current Phase: - Planning`.
3. Say `start`.
4. The model analyzes, fills the plan, writes findings into `# Progress` (stall-safe), sets `Current Phase: - Waiting Approval`, and stops. The loop goes quiet — that is correct: Waiting Approval is terminal.
5. Say `approved` → the model executes unchecked steps; between turns the loop nudges with the execution nudge until `Current Phase: - Complete`.

If the loop never fires:

- `.ai/AI_TASK.md` must be in the cwd where you run `pi` (not a parent dir).
- The file must contain a `Current Phase:` entry (raw unstructured pastes make the loop blind).
- Run `pi --verbose` to see extension load logs; `goal-loop` should print at startup.

---

## 7. Repo path used in this project (for reference)

This `digital-pharmacy` project has the working setup at:

- `C:\Users\Radit\source\repos\digital-pharmacy\.pi\extensions\goal-loop.ts`
- `C:\Users\Radit\source\repos\digital-pharmacy\.ai\AI_TASK.example.md` (template with planning contract)
- `C:\Users\Radit\source\repos\digital-pharmacy\.ai\AI_TASK.md` (current task)

You can copy all three files directly into project B and adapt the plan / phase to your task.
