'use client';

import { useEffect, useRef, useState } from 'react';
import { getAgentConversationMessages, listAgentConversations } from '@/lib/api/agent';
import type { AgentConversation } from '@/lib/api/types';
import { mapPersistedMessages } from './map-persisted-messages';
import type { DomainConversationState, Message } from './types';

const domainConversations = new Map<string, DomainConversationState>();

export function useChatConversations(args: {
    domainKey: string | null;
    agentBasePath: string | null;
}) {
    const { domainKey, agentBasePath } = args;

    const [messages, setMessages] = useState<Message[]>([]);
    const [conversations, setConversations] = useState<AgentConversation[]>([]);
    const [conversationId, setConversationId] = useState<string | undefined>();
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const prevDomainRef = useRef<string | null>(null);
    const loadRequestRef = useRef(0);

    useEffect(() => {
        if (domainKey) {
            domainConversations.set(domainKey, { messages, conversationId });
        }
    }, [conversationId, domainKey, messages]);

    useEffect(() => {
        let cancelled = false;

        async function hydrateConversationState() {
            if (domainKey === prevDomainRef.current) return;

            if (prevDomainRef.current) {
                domainConversations.set(prevDomainRef.current, {
                    messages,
                    conversationId,
                });
            }

            const saved = domainKey ? domainConversations.get(domainKey) : undefined;
            setMessages(saved?.messages || []);
            setConversationId(saved?.conversationId);
            setConversations([]);
            setHistoryError(null);
            prevDomainRef.current = domainKey;

            if (!domainKey || !agentBasePath) return;

            const requestId = ++loadRequestRef.current;
            setIsLoadingHistory(true);

            try {
                const recentConversations = await listAgentConversations(agentBasePath);
                if (cancelled || requestId !== loadRequestRef.current) return;

                setConversations(recentConversations);

                const targetConversationId =
                    saved?.conversationId || recentConversations[0]?.id;

                if (!targetConversationId) {
                    setMessages([]);
                    setConversationId(undefined);
                    return;
                }

                if (saved?.conversationId && saved.messages.length > 0) {
                    return;
                }

                const history = await getAgentConversationMessages(
                    agentBasePath,
                    targetConversationId,
                );
                if (cancelled || requestId !== loadRequestRef.current) return;

                setConversationId(targetConversationId);
                setMessages(mapPersistedMessages(history));
            } catch (error: any) {
                if (!cancelled) {
                    setHistoryError(error.message || 'No se pudo cargar el historial');
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingHistory(false);
                }
            }
        }

        void hydrateConversationState();

        return () => {
            cancelled = true;
        };
    }, [agentBasePath, conversationId, domainKey, messages]);

    async function loadConversationHistory(targetConversationId?: string) {
        if (!agentBasePath) return;

        const requestId = ++loadRequestRef.current;
        setIsLoadingHistory(true);
        setHistoryError(null);

        try {
            const recentConversations = await listAgentConversations(agentBasePath);
            if (requestId !== loadRequestRef.current) return;

            setConversations(recentConversations);

            const nextConversationId =
                targetConversationId || recentConversations[0]?.id;

            if (!nextConversationId) {
                setConversationId(undefined);
                setMessages([]);
                return;
            }

            const history = await getAgentConversationMessages(agentBasePath, nextConversationId);
            if (requestId !== loadRequestRef.current) return;

            setConversationId(nextConversationId);
            setMessages(mapPersistedMessages(history));
        } catch (error: any) {
            setHistoryError(error.message || 'No se pudo cargar el historial');
        } finally {
            setIsLoadingHistory(false);
        }
    }

    function startNewConversation() {
        setConversationId(undefined);
        setMessages([]);
        setHistoryError(null);
    }

    async function handleConversationSelect(targetConversationId: string) {
        if (targetConversationId === conversationId || !agentBasePath) return;
        await loadConversationHistory(targetConversationId);
    }

    return {
        messages,
        setMessages,
        conversations,
        conversationId,
        setConversationId,
        isLoadingHistory,
        historyError,
        loadConversationHistory,
        startNewConversation,
        handleConversationSelect,
    };
}
