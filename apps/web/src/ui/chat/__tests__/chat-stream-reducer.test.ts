import { describe, expect, it } from "vitest";
import {
  applyStreamEvent,
  getStreamErrorMessage,
  markStreamInterrupted,
} from "../chat-stream-reducer";
import type { Message } from "../types";

const ASSISTANT_ID = "assistant-1";

function baseMessages(): Message[] {
  return [
    { id: "user-1", role: "user", content: "Hola" },
    { id: ASSISTANT_ID, role: "assistant", content: "" },
  ];
}

const context = {
  assistantId: ASSISTANT_ID,
  createToolMessageId: () => "tool-msg-1",
};

describe("applyStreamEvent", () => {
  it("accumulates text on the assistant message only", () => {
    let messages = baseMessages();
    messages = applyStreamEvent(messages, { event: "text", text: "Hola, " }, context);
    messages = applyStreamEvent(messages, { event: "text", text: "que tal" }, context);

    expect(messages[1]).toMatchObject({ id: ASSISTANT_ID, content: "Hola, que tal" });
    expect(messages[0]).toMatchObject({ id: "user-1", content: "Hola" });
  });

  it("appends a pending tool message on tool_use with its input", () => {
    const messages = applyStreamEvent(
      baseMessages(),
      { event: "tool_use", tool: "create_task", input: { title: "Comprar cafe" } },
      context,
    );

    expect(messages).toHaveLength(3);
    expect(messages[2]).toMatchObject({
      id: "tool-msg-1",
      role: "tool",
      toolName: "create_task",
      pending: true,
      toolInput: { title: "Comprar cafe" },
    });
    expect(messages[2].action).toMatchObject({ tone: "info" });
  });

  it("ignores non-record tool_use input", () => {
    const messages = applyStreamEvent(
      baseMessages(),
      { event: "tool_use", tool: "create_task", input: "raw string" },
      context,
    );

    expect(messages[2].toolInput).toBeUndefined();
  });

  it("resolves the last matching pending tool message on tool_result", () => {
    let messages = applyStreamEvent(
      baseMessages(),
      { event: "tool_use", tool: "create_task", input: { title: "Comprar cafe" } },
      context,
    );
    messages = applyStreamEvent(
      messages,
      {
        event: "tool_result",
        tool: "create_task",
        result: JSON.stringify({ title: "Comprar cafe", scheduledDate: "2026-06-10" }),
      },
      context,
    );

    expect(messages[2]).toMatchObject({ pending: false });
    expect(messages[2].action).toMatchObject({
      title: "Tarea creada: Comprar cafe",
      tone: "success",
    });
  });

  it("leaves messages unchanged when tool_result has no matching tool message", () => {
    const messages = baseMessages();
    const next = applyStreamEvent(
      messages,
      { event: "tool_result", tool: "create_task", result: "{}" },
      context,
    );

    expect(next).toBe(messages);
  });

  it("attaches the trace url on done", () => {
    const messages = applyStreamEvent(
      baseMessages(),
      { event: "done", conversationId: "conv-1", traceUrl: "https://trace" },
      context,
    );

    expect(messages[1].traceUrl).toBe("https://trace");
  });

  it("leaves messages unchanged on done without trace url", () => {
    const messages = baseMessages();
    const next = applyStreamEvent(
      messages,
      { event: "done", conversationId: "conv-1" },
      context,
    );

    expect(next).toBe(messages);
  });

  it("replaces assistant content with a friendly error by code", () => {
    const messages = applyStreamEvent(
      baseMessages(),
      { event: "error", code: "provider_unavailable" },
      context,
    );

    expect(messages[1].content).toBe(
      "El proveedor de IA no esta disponible. Intenta de nuevo en unos minutos.",
    );
  });
});

describe("getStreamErrorMessage", () => {
  it("falls back to the raw error message when the code is unknown", () => {
    expect(getStreamErrorMessage(undefined, "boom")).toBe("Error: boom");
  });

  it("returns a generic message without code or fallback", () => {
    expect(getStreamErrorMessage()).toBe("Ocurrio un error inesperado.");
  });
});

describe("markStreamInterrupted", () => {
  it("flags the assistant message and finalizes pending tool messages", () => {
    let messages = applyStreamEvent(
      baseMessages(),
      { event: "tool_use", tool: "create_task", input: {} },
      context,
    );
    messages = applyStreamEvent(messages, { event: "text", text: "Creando" }, context);

    const interrupted = markStreamInterrupted(messages, ASSISTANT_ID);

    expect(interrupted[1]).toMatchObject({ interrupted: true, content: "Creando" });
    expect(interrupted[2]).toMatchObject({
      pending: false,
      content: "Accion interrumpida",
    });
    expect(interrupted[2].action).toMatchObject({ tone: "warning" });
  });

  it("does not touch resolved tool messages", () => {
    let messages = applyStreamEvent(
      baseMessages(),
      { event: "tool_use", tool: "create_task", input: {} },
      context,
    );
    messages = applyStreamEvent(
      messages,
      { event: "tool_result", tool: "create_task", result: "{}" },
      context,
    );

    const resolvedTool = messages[2];
    const interrupted = markStreamInterrupted(messages, ASSISTANT_ID);

    expect(interrupted[2]).toBe(resolvedTool);
  });
});
