import { AgentProviderRequest, AgentProviderResponse } from './types';

export interface AgentProvider {
    readonly name: string;
    readonly defaultModel: string;
    generate(request: AgentProviderRequest): Promise<AgentProviderResponse>;
}
