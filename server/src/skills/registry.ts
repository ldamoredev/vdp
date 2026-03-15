/**
 * Skill: A stateless, reusable capability that agents compose.
 *
 * Skills are NOT domain-specific tools (those live in domain/tools.ts).
 * Skills are cross-cutting capabilities like:
 * - analyze-trends: Detect trends in time-series data
 * - detect-anomaly: Flag unusual values
 * - send-notification: Push notification to user
 * - summarize: Generate natural language summary
 * - forecast: Simple forecasting from historical data
 */
export interface Skill<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  execute: (input: TInput) => Promise<TOutput>;
}

class SkillRegistryImpl {
  private skills = new Map<string, Skill>();

  register(skill: Skill): void {
    this.skills.set(skill.name, skill);
    console.log(`[SKILL REGISTRY] Registered skill: ${skill.name}`);
  }

  get<TInput = unknown, TOutput = unknown>(name: string): Skill<TInput, TOutput> | undefined {
    return this.skills.get(name) as Skill<TInput, TOutput> | undefined;
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  has(name: string): boolean {
    return this.skills.has(name);
  }

  async execute<TOutput = unknown>(name: string, input: unknown): Promise<TOutput> {
    const skill = this.skills.get(name);
    if (!skill) throw new Error(`Skill "${name}" not found`);
    return skill.execute(input) as Promise<TOutput>;
  }
}

export const skillRegistry = new SkillRegistryImpl();
export type SkillRegistry = SkillRegistryImpl;
