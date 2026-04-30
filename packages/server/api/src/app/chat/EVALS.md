# Chat evals

This document is the source of truth for the judge prompts and Langfuse setup
for the AI chat. Langfuse stores evaluators in the project workspace, not in
the repo, so we keep the prompts here for version control and reproducibility
across instances (Cloud, self-hosted, dev/staging/prod).

## Wire-up

The chat backend (`chat-service.ts`) emits one OpenTelemetry trace per
`POST /v1/chat/conversations/:id/messages` call. Each trace carries:

- `userId`, `sessionId` (= conversationId), `projectId`, `platformId`,
  `modelName`, `provider`, and the message tag set
- The full LLM input (system prompt + message history + new user message)
- The full LLM output text
- One nested span per agent step (multi-step agent, capped at `MAX_STEPS`)
- One nested span per MCP tool call with its arguments and tool result

`chat-service.ts` also persists `lastAssistantTraceId` on the conversation row
so that the user-feedback endpoint
(`POST /v1/chat/conversations/:id/feedback`) can attach a thumbs-up/down score
to the right Langfuse trace via `langfuse.score()`.

Tracing is **off by default**. To enable, set in the deployment env:

```
AP_LANGFUSE_ENABLED=true
AP_LANGFUSE_PUBLIC_KEY=pk-lf-...
AP_LANGFUSE_SECRET_KEY=sk-lf-...
# optional, defaults to https://cloud.langfuse.com
AP_LANGFUSE_HOST=https://your-langfuse.example.com
```

## Online judges (configured in the Langfuse UI)

Configure these three evaluators under **Settings → Evaluators** in your
Langfuse project. Sampling: **100%** (every trace) at MVP scale. Scope: traces
where `metadata.functionId == "chat.send-message"`. Judge model: GPT-4o or
Claude 3.5 Sonnet — either works; pick whichever has the lowest latency in
your region.

### 1. tool-call-correctness

**Purpose:** the chat agent has access to ~40 `ap_*` MCP tools (create flow,
list pieces, run a piece action, debug a run, etc.) plus a few local tools.
Picking the wrong tool, or feeding it nonsense args, is the most common
failure mode. This judge catches it.

**Variables to map:**

- `input` ← trace input (full conversation including the user's last message)
- `output` ← trace output (the assistant's final response text)
- `toolCalls` ← child spans whose name starts with `ai.tool.call` or
  whose `metadata.tool` attribute is set, formatted as
  `[{ name, arguments, result }, ...]`

**Prompt:**

```
You are evaluating an AI assistant that helps users build automation
flows in Activepieces. The assistant has access to tools named
ap_create_flow, ap_list_flows, ap_get_run, ap_list_pieces,
ap_run_action, and ~35 others.

Given the user's message and the tools the assistant called, decide
whether the assistant picked appropriate tools with appropriate
arguments to address the user's request.

USER REQUEST AND CONVERSATION:
{{input}}

ASSISTANT FINAL RESPONSE:
{{output}}

TOOL CALLS THE ASSISTANT MADE:
{{toolCalls}}

Score 1.0 if the assistant picked the right tools with sensible
arguments. Score 0.0 if it picked the wrong tools, hallucinated tool
names, supplied invalid arguments, or skipped tools that were clearly
needed. Use values in between for partial credit (e.g. right tools but
slightly wrong args = 0.5).

Output JSON: { "score": <0.0-1.0>, "reason": "<one sentence>" }
```

### 2. flow-build-success

**Purpose:** when users ask the agent to build, modify, or fix a flow, did it
actually finish the job? Measured by tool outcomes — did `ap_create_flow`
return success, did `ap_validate_flow` come back clean, did the requested
step actually get added?

**Variables to map:** same as `tool-call-correctness`.

**Prompt:**

```
You are evaluating whether an Activepieces AI assistant successfully
completed a user's flow-building request.

USER REQUEST:
{{input}}

ASSISTANT FINAL RESPONSE:
{{output}}

TOOL CALLS AND THEIR RESULTS:
{{toolCalls}}

If the user did NOT ask to build, modify, fix, or test a flow, return
score: -1 (we'll filter these out — only score flow-related sessions).

Otherwise, score:
- 1.0 if a flow was created/edited and the relevant ap_validate_flow
  or ap_test_flow call succeeded
- 0.5 if a flow was created/edited but validation failed or the
  assistant hand-waved away an error
- 0.0 if the assistant claimed success without actually running the
  required tools, or the user clearly didn't get what they asked for

Output JSON: { "score": <-1 or 0.0-1.0>, "reason": "<one sentence>" }
```

### 3. response-quality

**Purpose:** general response quality. Coherent, grounded in tool outputs,
no invented piece names or fictional features.

**Variables to map:** `input`, `output`, `toolCalls`.

**Prompt:**

```
You are evaluating the quality of an AI assistant's response in
Activepieces.

USER REQUEST AND CONVERSATION:
{{input}}

ASSISTANT FINAL RESPONSE:
{{output}}

EVIDENCE THE ASSISTANT GATHERED VIA TOOLS:
{{toolCalls}}

Score the assistant's final response on:
- Coherence — does it directly answer the user's question?
- Groundedness — are claims about pieces, actions, parameters, or run
  state backed by what the tools actually returned? Penalize made-up
  piece names ("@activepieces/piece-foo") or fictional fields.
- Helpfulness — does the user have what they need to take the next
  step?

Score 1.0 for excellent, 0.0 for misleading or hallucinated, with
intermediate values for partial credit.

Output JSON: { "score": <0.0-1.0>, "reason": "<one sentence>" }
```

## User feedback

The thumbs-up/down on the last assistant message (in the chat UI) calls the
feedback endpoint, which in turn calls `langfuse.score({ traceId, name:
"user-feedback", value: 0|1, comment? })` with a stable score id of
`chat-feedback-${traceId}`. The stable id means a user changing their mind
(thumbs-up → thumbs-down) overwrites the previous score in Langfuse rather
than stacking.

## Verification checklist

After PR 1 lands and the env vars are set in your dev/staging Langfuse
project:

1. Send a chat message → confirm a trace appears with the LLM call,
   nested tool calls, prompt + completion text, token usage, and the
   `userId`/`sessionId`/`projectId`/`platformId`/`modelName`/`provider`
   metadata.
2. Confirm `chat_conversation.lastAssistantTraceId` is populated.
3. Click thumbs-down + add a comment → confirm the same trace gets a
   `user-feedback` score with `value: 0` and the comment.
4. After 24h with traffic flowing, confirm all 3 online judges have
   scored sampled traces. Sanity-check 5-10 manually.
5. With `AP_LANGFUSE_ENABLED` unset, confirm zero outbound calls to
   Langfuse and that chat still works exactly as before.
