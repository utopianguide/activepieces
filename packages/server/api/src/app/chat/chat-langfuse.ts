import { isNil } from '@activepieces/shared'
import { Langfuse } from 'langfuse'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const LANGFUSE_DEFAULT_HOST = 'https://cloud.langfuse.com'

type LangfuseConfig = {
    enabled: boolean
    publicKey: string | undefined
    secretKey: string | undefined
    host: string
}

let cachedClient: Langfuse | null = null

function readLangfuseConfig(): LangfuseConfig {
    const enabled = system.getBoolean(AppSystemProp.LANGFUSE_ENABLED) ?? false
    const publicKey = system.get<string>(AppSystemProp.LANGFUSE_PUBLIC_KEY)
    const secretKey = system.get<string>(AppSystemProp.LANGFUSE_SECRET_KEY)
    const host = system.get<string>(AppSystemProp.LANGFUSE_HOST) ?? LANGFUSE_DEFAULT_HOST
    return { enabled, publicKey, secretKey, host }
}

function isReady(): boolean {
    const { enabled, publicKey, secretKey } = readLangfuseConfig()
    return enabled && !isNil(publicKey) && !isNil(secretKey)
}

function getClient(): Langfuse | null {
    if (!isNil(cachedClient)) {
        return cachedClient
    }
    const { enabled, publicKey, secretKey, host } = readLangfuseConfig()
    if (!enabled || isNil(publicKey) || isNil(secretKey)) {
        return null
    }
    cachedClient = new Langfuse({
        publicKey,
        secretKey,
        baseUrl: host,
    })
    return cachedClient
}

export const chatLangfuse = {
    isReady,
    getClient,
    getConfig: readLangfuseConfig,
}
