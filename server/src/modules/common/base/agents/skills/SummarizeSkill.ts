  import type { Skill } from "./SkillRegistry";

/**
 * Skill: summarize
 *
 * Takes an array of data records + context string and produces
 * a concise natural-language summary. Used by agents to produce
 * human-readable overviews of metrics, transactions, habits, etc.
 *
 * v1: Template-based (no LLM call, fast and free)
 * v2: Can be upgraded to use Claude for richer summaries
 */
export class SummarizeSkill implements Skill  {
  name = "summarize";
  description = "Generate a concise natural-language summary from structured data";
  execute = async (input: any) => {
    const { data, context } = input as { data: Record<string, unknown>[]; context: string };

    if (!data || data.length === 0) {
      return `No ${context} data available to summarize.`;
    }

    const count = data.length;
    const keys = Object.keys(data[0]);
    const keyList = keys.slice(0, 5).join(", ");

    return `Summary of ${count} ${context} record${count === 1 ? "" : "s"} (fields: ${keyList}). ` +
      `Latest entry: ${JSON.stringify(data[0]).slice(0, 200)}`;
  }
};
