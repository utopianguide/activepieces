import { isNil } from '@activepieces/shared'
import { FastifyOtelInstrumentation } from '@fastify/otel'
import { LangfuseSpanProcessor } from '@langfuse/otel'
import { Context } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { MetricReader, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor, ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { system } from './app/helper/system/system'
import { AppSystemProp } from './app/helper/system/system-props'

const ATTRIBUTES_TO_DROP = ['db.statement']

class FilteringSpanProcessor implements SpanProcessor {
    constructor(private readonly delegate: BatchSpanProcessor) {}

    onStart(span: Span, parentContext: Context): void {
        this.delegate.onStart(span, parentContext)
    }

    onEnd(span: ReadableSpan): void {
        for (const attr of ATTRIBUTES_TO_DROP) {
            Reflect.deleteProperty(span.attributes, attr)
        }
        this.delegate.onEnd(span)
    }

    shutdown(): Promise<void> {
        return this.delegate.shutdown()
    }

    forceFlush(): Promise<void> {
        return this.delegate.forceFlush()
    }
}

function getServiceName(): string {
    const isApp = system.isApp()
    const serviceName = isApp ? 'activepieces-api' : 'activepieces-worker'

    return serviceName
}

function buildSpanProcessors(): SpanProcessor[] {
    const processors: SpanProcessor[] = []

    if (system.get(AppSystemProp.OTEL_ENABLED)) {
        processors.push(new FilteringSpanProcessor(new BatchSpanProcessor(new OTLPTraceExporter())))
    }

    const langfuseEnabled = system.getBoolean(AppSystemProp.LANGFUSE_ENABLED) ?? false
    const langfusePublicKey = system.get<string>(AppSystemProp.LANGFUSE_PUBLIC_KEY)
    const langfuseSecretKey = system.get<string>(AppSystemProp.LANGFUSE_SECRET_KEY)
    if (langfuseEnabled && !isNil(langfusePublicKey) && !isNil(langfuseSecretKey)) {
        processors.push(new LangfuseSpanProcessor({
            publicKey: langfusePublicKey,
            secretKey: langfuseSecretKey,
            baseUrl: system.get<string>(AppSystemProp.LANGFUSE_HOST),
        }))
    }

    return processors
}

function buildMetricReader(): MetricReader | undefined {
    if (!system.get(AppSystemProp.OTEL_ENABLED)) {
        return undefined
    }
    return new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
        exportIntervalMillis: 60_000,
    })
}

const spanProcessors = buildSpanProcessors()

if (spanProcessors.length > 0) {
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: getServiceName(),
    })

    const sdk = new NodeSDK({
        spanProcessors,
        metricReader: buildMetricReader(),
        resource,
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-dns': { enabled: false },
                '@opentelemetry/instrumentation-net': { enabled: false },
            }),
            new FastifyOtelInstrumentation({
                servername: getServiceName(),
                registerOnInitialization: true,
            }),
        ],
    })

    sdk.start()
}
