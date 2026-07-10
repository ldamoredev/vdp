import { describe, expect, it } from "vitest";

import type { AgentMessageRecord } from "../agent-api";
import { mapPersistedMessages } from "../map-persisted-messages";

describe("mapPersistedMessages", () => {
  it("reconstructs a structured project-task proposal from persisted tool results", () => {
    const records: AgentMessageRecord[] = [
      {
        id: "assistant-1",
        conversationId: "conversation-1",
        role: "assistant",
        content: null,
        toolCalls: [
          {
            id: "tool-call-1",
            name: "propose_project_tasks",
            input: { projectId: "project-1" },
          },
        ],
        toolResult: null,
        createdAt: "2026-07-10T12:00:00.000Z",
      },
      {
        id: "tool-result-1",
        conversationId: "conversation-1",
        role: "tool",
        content: null,
        toolCalls: null,
        toolResult: {
          tool_use_id: "tool-call-1",
          content: JSON.stringify({
            projectId: "project-1",
            tasks: [
              { title: "Uno", priority: 2 },
              { title: "Dos", priority: 3 },
              { title: "Tres", priority: 1 },
            ],
          }),
        },
        createdAt: "2026-07-10T12:00:01.000Z",
      },
    ];

    expect(mapPersistedMessages(records)).toEqual([
      expect.objectContaining({
        id: "tool-result-1",
        role: "tool",
        toolName: "propose_project_tasks",
        toolInput: { projectId: "project-1" },
        proposal: {
          projectId: "project-1",
          tasks: [
            { id: "draft-1", title: "Uno", priority: 2 },
            { id: "draft-2", title: "Dos", priority: 3 },
            { id: "draft-3", title: "Tres", priority: 1 },
          ],
        },
      }),
    ]);
  });
});
