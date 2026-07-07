/**
 * Explicit registry of every table in the domain schemas, used by the owner
 * data export. The exporter compares this registry against information_schema
 * at runtime and refuses to run when they drift: a new domain table can never
 * be silently missing from the export — it must be classified here first.
 */

export type DbTable = { schema: string; table: string };

export type ExportDomain =
    | 'tasks'
    | 'wallet'
    | 'health'
    | 'medical'
    | 'projects'
    | 'objectives'
    | 'inbox';

export type TableExportRule = DbTable &
    (
        | { mode: 'owner'; domain: ExportDomain; ownerColumn: 'owner_user_id' }
        | { mode: 'global'; domain: ExportDomain; reason: string }
        | { mode: 'skip'; reason: string }
    );

const owner = (schema: string, table: string, domain: ExportDomain): TableExportRule => ({
    schema,
    table,
    domain,
    mode: 'owner',
    ownerColumn: 'owner_user_id',
});

export const EXPORT_REGISTRY: readonly TableExportRule[] = [
    // tasks
    owner('tasks', 'tasks', 'tasks'),
    owner('tasks', 'task_notes', 'tasks'),
    owner('tasks', 'task_insights', 'tasks'),
    owner('tasks', 'daily_review_state', 'tasks'),
    {
        schema: 'tasks',
        table: 'task_embeddings',
        mode: 'skip',
        reason: 'Derived similarity vectors; regenerated from task content, useless outside pgvector.',
    },
    // wallet
    owner('wallet', 'accounts', 'wallet'),
    owner('wallet', 'categories', 'wallet'),
    owner('wallet', 'transactions', 'wallet'),
    owner('wallet', 'recurring_transactions', 'wallet'),
    owner('wallet', 'savings_goals', 'wallet'),
    owner('wallet', 'savings_contributions', 'wallet'),
    owner('wallet', 'investments', 'wallet'),
    owner('wallet', 'loans', 'wallet'),
    owner('wallet', 'loan_payments', 'wallet'),
    owner('wallet', 'wallet_insights', 'wallet'),
    {
        schema: 'wallet',
        table: 'exchange_rates',
        mode: 'global',
        domain: 'wallet',
        reason: 'Reference data with no owner column; needed to interpret historical amounts.',
    },
    // health
    owner('health', 'habits', 'health'),
    owner('health', 'habit_logs', 'health'),
    owner('health', 'counters', 'health'),
    owner('health', 'counter_attempts', 'health'),
    owner('health', 'goals', 'health'),
    owner('health', 'mood_check_ins', 'health'),
    owner('health', 'weight_entries', 'health'),
    // medical (schema owned by the Health medical section; exported separately)
    owner('medical', 'records', 'medical'),
    owner('medical', 'attachments', 'medical'),
    // projects
    owner('projects', 'projects', 'projects'),
    owner('projects', 'clients', 'projects'),
    owner('projects', 'time_entries', 'projects'),
    // objectives
    owner('objectives', 'objectives', 'objectives'),
    // inbox
    owner('inbox', 'inbox_items', 'inbox'),
];

/** Schemas the completeness check sweeps. `core` is deliberately out of scope:
 *  auth/sessions/audit/agent-chat are operational data covered by the DB backup,
 *  not part of the owner's per-domain data export. */
export const EXPORT_SCHEMAS = ['tasks', 'wallet', 'health', 'medical', 'projects', 'objectives', 'inbox'] as const;

export type TableDiff = {
    /** Tables present in the database but not classified in the registry. */
    unregistered: DbTable[];
    /** Registry entries whose table no longer exists in the database. */
    missing: DbTable[];
};

const key = (t: DbTable) => `${t.schema}.${t.table}`;

export function diffTables(actual: readonly DbTable[], registry: readonly TableExportRule[]): TableDiff {
    const actualKeys = new Set(actual.map(key));
    const registryKeys = new Set(registry.map(key));

    return {
        unregistered: actual
            .filter((t) => !registryKeys.has(key(t)))
            .map(({ schema, table }) => ({ schema, table })),
        missing: registry
            .filter((r) => !actualKeys.has(key(r)))
            .map(({ schema, table }) => ({ schema, table })),
    };
}
