import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn((_prop: string): string | undefined => undefined)
const mockGetBoolean = vi.fn((_prop: string): boolean | undefined => undefined)

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        get: (prop: string) => mockGet(prop),
        getBoolean: (prop: string) => mockGetBoolean(prop),
    },
}))

describe('chatLangfuse', () => {
    beforeEach(() => {
        mockGet.mockReset()
        mockGetBoolean.mockReset()
        vi.resetModules()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('isReady returns false when LANGFUSE_ENABLED is not set', async () => {
        mockGetBoolean.mockReturnValue(undefined)
        mockGet.mockReturnValue(undefined)
        const { chatLangfuse } = await import('../../../../src/app/chat/chat-langfuse')
        expect(chatLangfuse.isReady()).toBe(false)
    })

    it('isReady returns false when enabled but keys missing', async () => {
        mockGetBoolean.mockReturnValue(true)
        mockGet.mockReturnValue(undefined)
        const { chatLangfuse } = await import('../../../../src/app/chat/chat-langfuse')
        expect(chatLangfuse.isReady()).toBe(false)
    })

    it('isReady returns true when enabled and both keys present', async () => {
        mockGetBoolean.mockReturnValue(true)
        mockGet.mockImplementation((prop) => {
            if (prop === 'LANGFUSE_PUBLIC_KEY') return 'pk-test'
            if (prop === 'LANGFUSE_SECRET_KEY') return 'sk-test'
            return undefined
        })
        const { chatLangfuse } = await import('../../../../src/app/chat/chat-langfuse')
        expect(chatLangfuse.isReady()).toBe(true)
    })

    it('getClient returns null when not enabled', async () => {
        mockGetBoolean.mockReturnValue(false)
        mockGet.mockImplementation((prop) => {
            if (prop === 'LANGFUSE_PUBLIC_KEY') return 'pk-test'
            if (prop === 'LANGFUSE_SECRET_KEY') return 'sk-test'
            return undefined
        })
        const { chatLangfuse } = await import('../../../../src/app/chat/chat-langfuse')
        expect(chatLangfuse.getClient()).toBeNull()
    })

    it('getConfig falls back to default Langfuse Cloud host', async () => {
        mockGetBoolean.mockReturnValue(true)
        mockGet.mockImplementation((prop) => {
            if (prop === 'LANGFUSE_PUBLIC_KEY') return 'pk-test'
            if (prop === 'LANGFUSE_SECRET_KEY') return 'sk-test'
            return undefined
        })
        const { chatLangfuse } = await import('../../../../src/app/chat/chat-langfuse')
        expect(chatLangfuse.getConfig().host).toBe('https://cloud.langfuse.com')
    })

    it('getConfig respects LANGFUSE_HOST override', async () => {
        mockGetBoolean.mockReturnValue(true)
        mockGet.mockImplementation((prop) => {
            if (prop === 'LANGFUSE_PUBLIC_KEY') return 'pk-test'
            if (prop === 'LANGFUSE_SECRET_KEY') return 'sk-test'
            if (prop === 'LANGFUSE_HOST') return 'https://langfuse.example.com'
            return undefined
        })
        const { chatLangfuse } = await import('../../../../src/app/chat/chat-langfuse')
        expect(chatLangfuse.getConfig().host).toBe('https://langfuse.example.com')
    })
})
