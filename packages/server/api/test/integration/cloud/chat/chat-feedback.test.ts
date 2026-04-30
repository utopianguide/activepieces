import { apId, ChatFeedback } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function seedConversation(projectId: string, userId: string, lastAssistantTraceId: string | null = null): Promise<string> {
    const conversationId = apId()
    const now = new Date().toISOString()
    await db.save('chat_conversation', {
        id: conversationId,
        created: now,
        updated: now,
        projectId,
        userId,
        title: null,
        modelName: null,
        messages: [],
        lastAssistantTraceId,
    })
    return conversationId
}

describe('Chat feedback endpoint', () => {
    it('persists thumbs-up feedback with no traceId when conversation has none', async () => {
        const ctx = await createTestContext(app, {
            plan: { chatEnabled: true },
        })
        const conversationId = await seedConversation(ctx.project.id, ctx.user.id)

        const res = await ctx.post(`/v1/chat/conversations/${conversationId}/feedback`, {
            value: 1,
            comment: 'great answer',
        }, { query: { projectId: ctx.project.id } })

        expect(res.statusCode).toBe(201)
        const body = res.json() as ChatFeedback
        expect(body.value).toBe(1)
        expect(body.comment).toBe('great answer')
        expect(body.traceId).toBeNull()
        expect(body.conversationId).toBe(conversationId)

        const persisted = await db.findOneByOrFail<ChatFeedback>('chat_feedback', { id: body.id })
        expect(persisted.value).toBe(1)
        expect(persisted.comment).toBe('great answer')
    })

    it('captures lastAssistantTraceId from the conversation', async () => {
        const ctx = await createTestContext(app, {
            plan: { chatEnabled: true },
        })
        const traceId = '0123456789abcdef0123456789abcdef'
        const conversationId = await seedConversation(ctx.project.id, ctx.user.id, traceId)

        const res = await ctx.post(`/v1/chat/conversations/${conversationId}/feedback`, {
            value: 0,
        }, { query: { projectId: ctx.project.id } })

        expect(res.statusCode).toBe(201)
        const body = res.json() as ChatFeedback
        expect(body.traceId).toBe(traceId)
        expect(body.value).toBe(0)
        expect(body.comment).toBeNull()
    })

    it('returns 404 when conversation does not exist', async () => {
        const ctx = await createTestContext(app, {
            plan: { chatEnabled: true },
        })

        const res = await ctx.post(`/v1/chat/conversations/${apId()}/feedback`, {
            value: 1,
        }, { query: { projectId: ctx.project.id } })

        expect(res.statusCode).toBe(404)
    })
})
