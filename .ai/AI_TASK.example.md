# Original Request

<!-- Paste your request verbatim below. Do not summarize, do not reformat.
     Preserve code blocks, payloads, error messages, URLs, etc. exactly.
     A top-level "NEW TASK" line is deprecated — this section is the source material. -->

(paste request here)

# Execution Plan

<!-- Fill during Planning. Group related work; no micro-tasks. -->

- [ ] (empty — filled by the agent during Planning)

# Progress

<!-- Append analysis findings here AS YOU GO — any byte change resets the
     goal-loop stall counter, so planning never silently stalls. -->

(notes)

# Verification

(pending)

# Task State

Current Phase:

- Planning

Current Step:

- Analyze the request and the repository; produce the Execution Plan.

Last Completed Step:

- (nothing yet)

Next Step:

- Fill the Execution Plan, note findings in # Progress, then set Current Phase: Waiting Approval and stop.

---

Planning contract (agent):

1. Fill `# Execution Plan` with an implementation-oriented checklist.
2. Append analysis findings to `# Progress` as you go — never leave long silent stretches.
3. Set `Current Phase: - Waiting Approval` and stop. Never modify code before approval.
4. On approval: execute all unchecked tasks without stopping between them, then verify and set `Current Phase: - Complete` (or `Blocked`).
5. Never restructure this file's sections; only edit content inside them.
