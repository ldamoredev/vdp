export type AgentErrorCode =
    | 'provider_unavailable'
    | 'tool_execution_failed'
    | 'conversation_not_found'
    | 'unknown';

export class AgentError extends Error {
    constructor(
        message: string,
        public readonly code: AgentErrorCode,
    ) {
        super(message);
        this.name = 'AgentError';
    }

    static providerUnavailable(message: string): AgentError {
        return new AgentError(message, 'provider_unavailable');
    }

    static toolExecutionFailed(message: string): AgentError {
        return new AgentError(message, 'tool_execution_failed');
    }

    static conversationNotFound(message: string): AgentError {
        return new AgentError(message, 'conversation_not_found');
    }
}

export function getAgentErrorCode(error: unknown): AgentErrorCode {
    if (error instanceof AgentError) return error.code;
    return 'unknown';
}
