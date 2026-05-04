import { isNil, tryCatch } from '@activepieces/shared'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { Langfuse } from 'langfuse'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { CHAT_JUDGES, ChatJudge } from './chat-judges'
import { chatLangfuse } from './chat-langfuse'

const DEFAULT_INTERVAL_SECONDS = 60
const DEFAULT_BATCH_SIZE = 50
const DEFAULT_MODEL = 'claude-3-5-haiku-latest'
const DEFAULT_PROVIDER = 'anthropic'
const PROMPT_FIELD_TRUNCATE_CHARS = 10_000
const POLL_LAG_MS = 5_000
const CHAT_TAG = 'chat'
const TOP_LEVEL_GENERATION_NAME = 'chat.send-message:ai.streamText'

let pollTimer: NodeJS.Timeout | null = null
let cursor: Date | null = null
let runningTick = false

function readEvaluatorConfig(): EvaluatorConfig {
    const enabled = system.getBoolean(AppSystemProp.LANGFUSE_EVALUATOR_ENABLED) ?? false
    const apiKey = system.get<string>(AppSystemProp.LANGFUSE_EVALUATOR_API_KEY)
    const provider = system.get<string>(AppSystemProp.LANGFUSE_EVALUATOR_PROVIDER) ?? DEFAULT_PROVIDER
    const model = system.get<string>(AppSystemProp.LANGFUSE_EVALUATOR_MODEL) ?? DEFAULT_MODEL
    const intervalSeconds = system.getNumber(AppSystemProp.LANGFUSE_EVALUATOR_INTERVAL_SECONDS) ?? DEFAULT_INTERVAL_SECONDS
    const batchSize = system.getNumber(AppSystemProp.LANGFUSE_EVALUATOR_BATCH_SIZE) ?? DEFAULT_BATCH_SIZE
    return { enabled, apiKey, provider, model, intervalSeconds, batchSize }
}

function buildJudgeModel({ provider, apiKey, model }: { provider: string, apiKey: string, model: string }): LanguageModel {
    if (provider === 'openai') {
        return createOpenAI({ apiKey })(model)
    }
    return createAnthropic({ apiKey })(model)
}

function stringifyForPrompt(value: unknown): string {
    if (isNil(value)) {
        return '(empty)'
    }
    const raw = typeof value === 'string' ? value : JSON.stringify(value)
    if (raw.length <= PROMPT_FIELD_TRUNCATE_CHARS) {
        return raw
    }
    return raw.slice(0, PROMPT_FIELD_TRUNCATE_CHARS) + '\n...[truncated]'
}

function renderPrompt({ judge, input, output }: { judge: ChatJudge, input: unknown, output: unknown }): string {
    return judge.prompt
        .replace('{{input}}', stringifyForPrompt(input))
        .replace('{{output}}', stringifyForPrompt(output))
}

function extractJsonObject(text: string): { score: unknown, reason: unknown } | null {
    const trimmed = text.trim()
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/i)
    const candidate = fenced ? fenced[1] : trimmed
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) {
        return null
    }
    const slice = candidate.slice(start, end + 1)
    try {
        const parsed = JSON.parse(slice) as Record<string, unknown>
        return { score: parsed.score, reason: parsed.reason }
    }
    catch {
        return null
    }
}

function parseScore(value: unknown): number | null {
    if (value === null) {
        return null
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        const clamped = Math.max(0, Math.min(1, value))
        return clamped
    }
    if (typeof value === 'string') {
        const n = Number(value)
        if (Number.isFinite(n)) {
            return Math.max(0, Math.min(1, n))
        }
    }
    return null
}

function parseReason(value: unknown): string | undefined {
    if (typeof value === 'string' && value.length > 0) {
        return value.slice(0, 1_000)
    }
    return undefined
}

async function runJudge({
    judge,
    judgeModel,
    trace,
    log,
}: {
    judge: ChatJudge
    judgeModel: LanguageModel
    trace: { id: string, input?: unknown, output?: unknown }
    log: FastifyBaseLogger
}): Promise<{ score: number | null, reason: string | undefined } | null> {
    const prompt = renderPrompt({ judge, input: trace.input, output: trace.output })
    const { data, error } = await tryCatch(async () => generateText({
        model: judgeModel,
        prompt,
        maxOutputTokens: 200,
        temperature: 0,
    }))
    if (error) {
        log.warn({ err: error, judge: judge.name, traceId: trace.id }, 'Judge model call failed')
        return null
    }
    const json = extractJsonObject(data.text)
    if (isNil(json)) {
        log.warn({ judge: judge.name, traceId: trace.id, text: data.text.slice(0, 200) }, 'Judge response not parseable as JSON')
        return null
    }
    const score = parseScore(json.score)
    const reason = parseReason(json.reason)
    if (isNil(score)) {
        if (judge.allowNull) {
            return { score: null, reason }
        }
        log.warn({ judge: judge.name, traceId: trace.id, raw: json.score }, 'Judge returned non-numeric score for non-nullable judge')
        return null
    }
    return { score, reason }
}

async function postScore({
    client,
    traceId,
    judge,
    score,
    reason,
}: {
    client: Langfuse
    traceId: string
    judge: ChatJudge
    score: number
    reason: string | undefined
}): Promise<void> {
    client.score({
        id: `chat-judge-${judge.name}-${traceId}`,
        traceId,
        name: judge.name,
        value: score,
        comment: reason,
    })
}

async function evaluateTrace({
    client,
    judgeModel,
    trace,
    log,
}: {
    client: Langfuse
    judgeModel: LanguageModel
    trace: { id: string, input?: unknown, output?: unknown }
    log: FastifyBaseLogger
}): Promise<{ scoresWritten: number, errors: number, skipped: boolean }> {
    const traceWithContent = await loadTraceContent({ client, traceId: trace.id, log })
    if (isNil(traceWithContent)) {
        return { scoresWritten: 0, errors: 0, skipped: true }
    }
    const results = await Promise.allSettled(
        CHAT_JUDGES.map((judge) => runJudge({ judge, judgeModel, trace: traceWithContent, log })),
    )
    let scoresWritten = 0
    let errors = 0
    for (let i = 0; i < CHAT_JUDGES.length; i++) {
        const judge = CHAT_JUDGES[i]
        const settled = results[i]
        if (settled.status === 'rejected') {
            errors++
            continue
        }
        const result = settled.value
        if (isNil(result) || isNil(result.score)) {
            continue
        }
        await postScore({ client, traceId: trace.id, judge, score: result.score, reason: result.reason })
        scoresWritten++
    }
    return { scoresWritten, errors, skipped: false }
}

async function loadTraceContent({
    client,
    traceId,
    log,
}: {
    client: Langfuse
    traceId: string
    log: FastifyBaseLogger
}): Promise<{ id: string, input: unknown, output: unknown } | null> {
    const { data, error } = await tryCatch(async () => client.fetchTrace(traceId))
    if (error || isNil(data)) {
        log.warn({ err: error, traceId }, 'Chat evaluator: fetchTrace failed')
        return null
    }
    const trace = data.data as { id: string, input?: unknown, output?: unknown, observations?: Array<{ name?: string, input?: unknown, output?: unknown }> }
    let input: unknown = trace.input
    let output: unknown = trace.output
    if (isNil(input) || isNil(output)) {
        const top = (trace.observations ?? []).find((o) => o.name === TOP_LEVEL_GENERATION_NAME)
        if (!isNil(top)) {
            input = isNil(input) ? top.input : input
            output = isNil(output) ? top.output : output
        }
    }
    if (isNil(input) && isNil(output)) {
        return null
    }
    return { id: traceId, input, output }
}

function isChatTrace(trace: { metadata?: unknown }): boolean {
    if (typeof trace.metadata !== 'object' || trace.metadata === null) {
        return false
    }
    const tags = (trace.metadata as Record<string, unknown>).langfuseTags
    return Array.isArray(tags) && tags.includes(CHAT_TAG)
}

async function tick({ log }: { log: FastifyBaseLogger }): Promise<void> {
    if (runningTick) {
        return
    }
    runningTick = true
    try {
        const config = readEvaluatorConfig()
        if (!config.enabled || isNil(config.apiKey)) {
            return
        }
        const client = chatLangfuse.getClient()
        if (isNil(client)) {
            return
        }
        const judgeModel = buildJudgeModel({ provider: config.provider, apiKey: config.apiKey, model: config.model })
        const fromTimestamp = cursor ?? new Date(Date.now() - config.intervalSeconds * 1_000)
        const toTimestamp = new Date(Date.now() - POLL_LAG_MS)
        if (toTimestamp <= fromTimestamp) {
            return
        }

        const { data: page, error } = await tryCatch(async () => client.fetchTraces({
            fromTimestamp,
            toTimestamp,
            limit: config.batchSize,
            orderBy: 'timestamp.asc',
        }))
        if (error) {
            log.warn({ err: error }, 'Chat evaluator: fetchTraces failed')
            return
        }

        const allTraces = page.data ?? []
        const chatTraces = allTraces.filter(isChatTrace)
        if (chatTraces.length === 0) {
            cursor = toTimestamp
            log.debug({ tracesSeen: allTraces.length, fromTimestamp, toTimestamp }, 'Chat evaluator tick: no chat traces in window')
            return
        }

        let scoresWritten = 0
        let errors = 0
        let skipped = 0
        for (const trace of chatTraces) {
            const result = await evaluateTrace({ client, judgeModel, trace, log })
            scoresWritten += result.scoresWritten
            errors += result.errors
            if (result.skipped) {
                skipped++
            }
        }
        await client.flushAsync().catch((err: unknown) => log.warn({ err }, 'Chat evaluator: flush failed'))
        cursor = toTimestamp
        log.info({ tracesEvaluated: chatTraces.length - skipped, tracesSkipped: skipped, scoresWritten, errors, judges: CHAT_JUDGES.length }, 'Chat evaluator tick complete')
    }
    finally {
        runningTick = false
    }
}

function start({ log }: { log: FastifyBaseLogger }): void {
    if (!isNil(pollTimer)) {
        return
    }
    const config = readEvaluatorConfig()
    if (!config.enabled) {
        return
    }
    if (isNil(config.apiKey)) {
        log.warn('Chat evaluator enabled but LANGFUSE_EVALUATOR_API_KEY is missing; skipping start')
        return
    }
    if (!chatLangfuse.isReady()) {
        log.warn('Chat evaluator enabled but base Langfuse tracing is not ready; skipping start')
        return
    }
    cursor = new Date(Date.now() - POLL_LAG_MS)
    const intervalMs = Math.max(10_000, config.intervalSeconds * 1_000)
    pollTimer = setInterval(() => {
        void tick({ log }).catch((err) => log.error({ err }, 'Chat evaluator tick errored'))
    }, intervalMs)
    log.info({ intervalSeconds: config.intervalSeconds, batchSize: config.batchSize, model: config.model, provider: config.provider, judges: CHAT_JUDGES.length }, 'Chat evaluator started')
}

function stop(): void {
    if (!isNil(pollTimer)) {
        clearInterval(pollTimer)
        pollTimer = null
    }
}

export const chatEvaluator = {
    start,
    stop,
}

type EvaluatorConfig = {
    enabled: boolean
    apiKey: string | undefined
    provider: string
    model: string
    intervalSeconds: number
    batchSize: number
}
