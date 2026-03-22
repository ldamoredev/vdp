type ToolTone = "success" | "info" | "warning" | "error";

export interface ToolActionView {
  title: string;
  detail?: string;
  items?: string[];
  tone: ToolTone;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : undefined;
}

function parseJson(content?: string | null): unknown {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function takeTaskTitles(tasks: unknown, max = 3) {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .map((task) => (isRecord(task) ? asString(task.title) : undefined))
    .filter((title): title is string => !!title)
    .slice(0, max);
}

function taskStateLabel(status?: string) {
  switch (status) {
    case "done":
      return "Completada";
    case "discarded":
      return "Descartada";
    default:
      return "Actualizada";
  }
}

function priorityTag(p: unknown): string | undefined {
  if (p === 3) return "Alta";
  if (p === 2) return "Media";
  if (p === 1) return "Baja";
  return undefined;
}

function formatTaskSummary(task: Record<string, unknown>) {
  const title = asString(task.title) || "Tarea";
  const scheduledDate = asString(task.scheduledDate);
  return {
    title,
    scheduledDate,
    status: asString(task.status),
    priority: asNumber(task.priority),
    carryOverCount: asNumber(task.carryOverCount),
  };
}

export function getToolDisplayName(tool: string) {
  switch (tool) {
    case "create_task":
      return "Crear tarea";
    case "list_tasks":
      return "Listar tareas";
    case "get_task":
      return "Ver tarea";
    case "update_task":
      return "Actualizar tarea";
    case "delete_task":
      return "Eliminar tarea";
    case "complete_task":
      return "Completar tarea";
    case "carry_over_task":
      return "Reprogramar tarea";
    case "discard_task":
      return "Descartar tarea";
    case "add_task_note":
      return "Agregar nota";
    case "get_end_of_day_review":
      return "Review del dia";
    case "carry_over_all_pending":
      return "Reprogramar pendientes";
    case "get_today_stats":
      return "Ver estadisticas";
    case "get_completion_trend":
      return "Ver tendencia";
    case "get_insights":
      return "Leer insights";
    case "mark_insights_read":
      return "Marcar insights";
    default:
      return tool;
  }
}

export function parseToolAction(tool: string, result?: string | null): ToolActionView {
  const parsed = parseJson(result);

  if (isRecord(parsed) && typeof parsed.error === "string") {
    return {
      title: getToolDisplayName(tool),
      detail: parsed.error,
      tone: "error",
    };
  }

  if (tool === "create_task" && isRecord(parsed)) {
    const task = formatTaskSummary(parsed);
    const parts: string[] = [];
    if (task.scheduledDate) parts.push(`Programada para ${task.scheduledDate}`);
    const pTag = priorityTag(task.priority);
    if (pTag) parts.push(`Prioridad: ${pTag}`);
    return {
      title: `Tarea creada: ${task.title}`,
      detail: parts.length > 0 ? parts.join(" · ") : "Agregada a tu lista",
      tone: "success",
    };
  }

  if ((tool === "update_task" || tool === "complete_task" || tool === "carry_over_task" || tool === "discard_task") && isRecord(parsed)) {
    const task = formatTaskSummary(parsed);
    const actionLabel = tool === "carry_over_task" ? "Reprogramada" : taskStateLabel(task.status);
    const detailParts: string[] = [];

    if (tool === "complete_task" && task.scheduledDate) {
      detailParts.push(`Fecha: ${task.scheduledDate}`);
    }

    if (tool === "carry_over_task") {
      if (task.scheduledDate) detailParts.push(`para ${task.scheduledDate}`);
      if (typeof task.carryOverCount === "number" && task.carryOverCount > 0) {
        detailParts.push(`(${task.carryOverCount} carry-over)`);
      }
    }

    let tone: ToolTone = tool === "discard_task" ? "warning" : "success";
    if (tool === "carry_over_task" && typeof task.carryOverCount === "number" && task.carryOverCount >= 3) {
      tone = "warning";
      detailParts.push("— Esta tarea se arrastra hace dias");
    }

    return {
      title: `${actionLabel}: ${task.title}`,
      detail: detailParts.filter(Boolean).join(" ") || undefined,
      tone,
    };
  }

  if (tool === "delete_task" && isRecord(parsed)) {
    return {
      title: "Tarea eliminada",
      detail: asString(parsed.message) || "Se elimino la tarea",
      tone: "warning",
    };
  }

  if (tool === "add_task_note" && isRecord(parsed)) {
    return {
      title: "Nota agregada",
      detail: asString(parsed.content) || "La nota se guardo en la tarea",
      tone: "success",
    };
  }

  if (tool === "list_tasks" && isRecord(parsed)) {
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    return {
      title: tasks.length === 0 ? "No hay tareas" : `${tasks.length} tareas encontradas`,
      detail:
        tasks.length > 0
          ? "Estas son las tareas que coinciden con el filtro"
          : "No se encontraron tareas para ese criterio",
      items: takeTaskTitles(tasks),
      tone: "info",
    };
  }

  if (tool === "get_task" && isRecord(parsed) && isRecord(parsed.task)) {
    const task = formatTaskSummary(parsed.task);
    const notes = Array.isArray(parsed.notes) ? parsed.notes.length : 0;
    return {
      title: `Detalle de tarea: ${task.title}`,
      detail: notes > 0 ? `${notes} nota${notes === 1 ? "" : "s"} asociadas` : "Sin notas",
      tone: "info",
    };
  }

  if (tool === "carry_over_all_pending" && isRecord(parsed)) {
    const carriedOver =
      asNumber(parsed.carriedOver) ||
      (Array.isArray(parsed.tasks) ? parsed.tasks.length : 0);
    const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    const firstDate = tasks.length > 0 && isRecord(tasks[0]) ? asString(tasks[0].scheduledDate) : undefined;

    return {
      title: `${carriedOver} tarea${carriedOver === 1 ? "" : "s"} reprogramada${carriedOver === 1 ? "" : "s"}`,
      detail: firstDate
        ? `Movidas a ${firstDate}`
        : "Se movieron las tareas pendientes",
      items: takeTaskTitles(parsed.tasks),
      tone: "warning",
    };
  }

  if (tool === "get_end_of_day_review" && isRecord(parsed)) {
    const completed = asNumber(parsed.completed) ?? 0;
    const pending = asNumber(parsed.pending) ?? 0;
    const rate = asNumber(parsed.completionRate);
    return {
      title: "Review del dia",
      detail: `${completed} completadas, ${pending} pendientes${typeof rate === "number" ? `, ${rate}% de cumplimiento` : ""}`,
      items: takeTaskTitles(parsed.tasks),
      tone: "info",
    };
  }

  if (tool === "get_today_stats" && isRecord(parsed)) {
    const completed = asNumber(parsed.completed) ?? 0;
    const pending = asNumber(parsed.pending) ?? 0;
    const rate = asNumber(parsed.completionRate) ?? 0;
    return {
      title: "Estadisticas de hoy",
      detail: `${completed} completadas, ${pending} pendientes, ${rate}% de cumplimiento`,
      tone: "info",
    };
  }

  if (tool === "get_completion_trend" && Array.isArray(parsed)) {
    return {
      title: "Tendencia cargada",
      detail: `${parsed.length} dias de historial disponibles`,
      tone: "info",
    };
  }

  if (tool === "get_insights" && isRecord(parsed)) {
    const unread = Array.isArray(parsed.unread) ? parsed.unread.length : 0;
    return {
      title: "Insights cargados",
      detail:
        unread > 0
          ? `${unread} insight${unread === 1 ? "" : "s"} nuevos`
          : "No hay insights nuevos",
      tone: "info",
    };
  }

  if (tool === "mark_insights_read") {
    return {
      title: "Insights marcados",
      detail: "Los insights quedaron como leidos",
      tone: "success",
    };
  }

  if (typeof parsed === "string" && parsed.trim().length > 0) {
    return {
      title: getToolDisplayName(tool),
      detail: parsed,
      tone: "info",
    };
  }

  return {
    title: getToolDisplayName(tool),
    detail: "Operacion completada",
    tone: "info",
  };
}
