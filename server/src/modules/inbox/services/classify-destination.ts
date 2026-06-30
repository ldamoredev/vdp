import { AgentProvider } from '../../common/base/agents/providers/AgentProvider';

export type InboxDestination = 'tasks' | 'wallet';

const SYSTEM_PROMPT =
    'Clasificá el texto en exactamente una palabra: "tasks" si es algo para hacer/una tarea, ' +
    '"wallet" si es un gasto/ingreso de plata, o "none" si no es ninguna de las dos. ' +
    'Respondé SOLO esa palabra, nada más.';

/**
 * One-shot classification, not a chat: no tools, no conversation persistence.
 * Best-effort — a triage suggestion is optional, so this never throws.
 */
export async function classifyInboxDestination(
    provider: AgentProvider,
    text: string,
): Promise<InboxDestination | null> {
    try {
        const response = await provider.generate({
            model: process.env.AGENT_MODEL || provider.defaultModel,
            maxTokens: 16,
            systemPrompt: SYSTEM_PROMPT,
            tools: [],
            messages: [{ role: 'user', content: text }],
        });
        const answer = response.text.trim().toLowerCase();
        if (answer.includes('tasks')) return 'tasks';
        if (answer.includes('wallet')) return 'wallet';
        return null;
    } catch {
        return null;
    }
}
