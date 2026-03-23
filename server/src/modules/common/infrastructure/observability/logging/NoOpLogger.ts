import { Logger, LogMetadata } from '../../../base/observability/logging/Logger';

export class NoOpLogger implements Logger {
    debug(_message: string, _metadata?: LogMetadata): void {}
    info(_message: string, _metadata?: LogMetadata): void {}
    warn(_message: string, _metadata?: LogMetadata): void {}
    error(_message: string, _metadata?: LogMetadata): void {}
}
