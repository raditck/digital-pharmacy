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