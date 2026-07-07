#!/usr/bin/env node
// Eval de modelos OpenAI-compatible (OpenCode Zen) para los agentes de VDP.
// Replica exactamente lo que hace OpenAICompatibleAgentProvider: POST {base}/v1/chat/completions,
// stream:false, tools en formato OpenAI. Mide lo que le importa a VDP:
// tool calls con JSON valido, enums/fechas correctas, una sola llamada por pedido, latencia.
//
// Uso:
//   node model-eval.mjs models
//   node model-eval.mjs eval <modelId> [<modelId> ...]
//
// Credenciales: lee OPENAI_COMPAT_BASE_URL / OPENAI_COMPAT_API_KEY del entorno,
// y si faltan, extrae SOLO esas claves de server/.env (nunca imprime valores).

import { readFileSync } from 'node:fs';

const WANTED = ['OPENAI_COMPAT_BASE_URL', 'OPENAI_COMPAT_API_KEY'];

function loadCreds() {
    const creds = {};
    for (const k of WANTED) if (process.env[k]) creds[k] = process.env[k];
    if (WANTED.every((k) => creds[k])) return creds;
    try {
        const raw = readFileSync(process.env.VDP_ENV_FILE ?? '/Users/nicolasbottarini/projects/vdp/server/.env', 'utf8');
        for (const line of raw.split('\n')) {
            const m = line.match(/^\s*(OPENAI_COMPAT_BASE_URL|OPENAI_COMPAT_API_KEY)\s*=\s*(.+?)\s*$/);
            if (m && !creds[m[1]]) creds[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
    } catch { /* no .env: seguimos con lo que haya */ }
    return creds;
}

const creds = loadCreds();
const BASE = (creds.OPENAI_COMPAT_BASE_URL ?? '').replace(/\/$/, '');
const KEY = creds.OPENAI_COMPAT_API_KEY ?? '';

if (!BASE || !KEY) {
    console.error(`Faltan credenciales. BASE_URL: ${BASE ? 'ok' : 'FALTA'} | API_KEY: ${KEY ? `ok (${KEY.length} chars)` : 'FALTA'}`);
    console.error('Definilas en server/.env (OPENAI_COMPAT_BASE_URL, OPENAI_COMPAT_API_KEY) o exportalas.');
    process.exit(1);
}

// ---------- tools reales (copiadas de tasks/infrastructure/agent/tools/management-tools.ts) ----------
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'create_task',
            description: 'Create a new task for today (or a specific date). Only use this after the task is clear enough to execute. If the user message is vague, ask a follow-up first. Returns the created task. IMPORTANT: Only call this tool ONCE per task. Never call it twice for the same request.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'Task title' },
                    description: { type: 'string', description: 'Optional description' },
                    priority: { type: 'number', enum: [1, 2, 3], description: 'Priority: 1=low, 2=medium, 3=high. Default: 2' },
                    scheduledDate: { type: 'string', description: 'Date (YYYY-MM-DD). Defaults to today.' },
                    domain: { type: 'string', enum: ['work', 'personal', 'health', 'finance', 'learning'], description: 'Optional domain tag' },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'list_tasks',
            description: "List tasks filtered by scheduled date, completion date, status, domain, or priority. Defaults to today's active tasks, and if status='done' with no date it defaults to tasks completed today.",
            parameters: {
                type: 'object',
                properties: {
                    scheduledDate: { type: 'string', description: 'Date filter (YYYY-MM-DD). Default: today.' },
                    completedDate: { type: 'string', description: 'Completion date filter (YYYY-MM-DD). Use this for questions like "que hice hoy".' },
                    status: { type: 'string', enum: ['pending', 'in_progress', 'done', 'discarded'] },
                    domain: { type: 'string', enum: ['work', 'personal', 'health', 'finance', 'learning'] },
                    priority: { type: 'number', enum: [1, 2, 3] },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'add_task_note',
            description: 'Add a note to a task. Use this to save breakdown steps, blockers, or clarified next actions.',
            parameters: {
                type: 'object',
                properties: {
                    taskId: { type: 'string', description: 'Task ID' },
                    content: { type: 'string', description: 'Note content' },
                    type: { type: 'string', enum: ['general', 'breakdown_step', 'blocker'], description: 'Note type. Use breakdown_step for executable steps, blocker for explicit obstacles.' },
                },
                required: ['taskId', 'content'],
            },
        },
    },
];

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = iso(new Date(today.getTime() - today.getTimezoneOffset() * 60000));
const YESTERDAY = iso(new Date(today.getTime() - today.getTimezoneOffset() * 60000 - 86400000));

const SYSTEM = `Sos el asistente de tareas de VDP, un sistema personal de ejecucion diaria. Hoy es ${TODAY}. Usa las tools cuando el pedido lo requiera; si es una pregunta general, responde sin tools. Las fechas van siempre en formato YYYY-MM-DD. Responde en castellano, breve y concreto. Nunca llames dos veces la misma tool para el mismo pedido.`;

// ---------- escenarios ----------
const scenarios = [
    {
        id: 'S1 create simple',
        messages: [{ role: 'user', content: 'Creá una tarea para hoy: comprar leche, prioridad alta.' }],
        judge(r) {
            const calls = r.toolCalls;
            if (calls.length !== 1) return fail(`esperaba 1 tool call, hubo ${calls.length}${summCalls(calls)}`);
            const c = calls[0];
            if (c.name !== 'create_task') return fail(`tool equivocada: ${c.name}`);
            if (c.parseError) return fail('argumentos JSON malformados');
            if (!c.args.title || !/leche/i.test(c.args.title)) return fail(`title dudoso: ${JSON.stringify(c.args.title)}`);
            if (c.args.priority !== 3) return fail(`priority=${c.args.priority}, esperaba 3`);
            if (c.args.scheduledDate && c.args.scheduledDate !== TODAY) return fail(`scheduledDate=${c.args.scheduledDate}`);
            return pass(`args ok: ${JSON.stringify(c.args)}`);
        },
    },
    {
        id: 'S2 restraint (sin tool)',
        messages: [{ role: 'user', content: '¿Qué conviene hacer primero a la mañana: planificar o ejecutar? Contestame en una frase.' }],
        judge(r) {
            if (r.toolCalls.length > 0) return fail(`llamó tools sin necesidad:${summCalls(r.toolCalls)}`);
            if (!r.text.trim()) return fail('respuesta vacía');
            return pass(`"${r.text.trim().slice(0, 90)}..."`);
        },
    },
    {
        id: 'S3 fecha (ayer)',
        messages: [{ role: 'user', content: 'Listame las tareas que completé ayer.' }],
        judge(r) {
            const calls = r.toolCalls;
            if (calls.length !== 1) return fail(`esperaba 1 tool call, hubo ${calls.length}${summCalls(calls)}`);
            const c = calls[0];
            if (c.name !== 'list_tasks') return fail(`tool equivocada: ${c.name}`);
            if (c.parseError) return fail('argumentos JSON malformados');
            if (c.args.completedDate !== YESTERDAY) return fail(`completedDate=${JSON.stringify(c.args.completedDate)}, esperaba ${YESTERDAY} (args: ${JSON.stringify(c.args)})`);
            return pass(`completedDate=${c.args.completedDate}`);
        },
    },
    {
        id: 'S4 enum + id literal',
        messages: [{ role: 'user', content: 'Agregale a la tarea con id 123 una nota de bloqueo que diga: esperando al contador.' }],
        judge(r) {
            const calls = r.toolCalls;
            if (calls.length !== 1) return fail(`esperaba 1 tool call, hubo ${calls.length}${summCalls(calls)}`);
            const c = calls[0];
            if (c.name !== 'add_task_note') return fail(`tool equivocada: ${c.name}`);
            if (c.parseError) return fail('argumentos JSON malformados');
            if (String(c.args.taskId) !== '123') return fail(`taskId=${JSON.stringify(c.args.taskId)}`);
            if (c.args.type !== 'blocker') return fail(`type=${JSON.stringify(c.args.type)}, esperaba 'blocker'`);
            if (!/contador/i.test(String(c.args.content ?? ''))) return fail(`content=${JSON.stringify(c.args.content)}`);
            return pass(`args ok`);
        },
    },
    {
        id: 'S5 cierre multi-turn',
        messages: [
            { role: 'user', content: 'Creá una tarea: pagar el monotributo.' },
            {
                role: 'assistant', content: '', tool_calls: [{
                    id: 'call_1', type: 'function',
                    function: { name: 'create_task', arguments: JSON.stringify({ title: 'Pagar el monotributo' }) },
                }],
            },
            {
                role: 'tool', tool_call_id: 'call_1',
                content: JSON.stringify({
                    id: 'abc-1', title: 'Pagar el monotributo', status: 'pending', scheduledDate: TODAY,
                    similarTasks: [{ content: 'Pagar monotributo febrero', matchPercent: 91 }],
                    warning: 'Se encontraron 1 tarea(s) similares. Avisale al usuario.',
                }),
            },
        ],
        judge(r) {
            if (r.toolCalls.length > 0) return fail(`siguió llamando tools:${summCalls(r.toolCalls)}`);
            if (!r.text.trim()) return fail('sin respuesta final');
            const mentions = /similar|parecid|duplicad|ya (exist|ten[eé]s)/i.test(r.text);
            return pass(`${mentions ? 'avisa del duplicado' : 'NO menciona el duplicado'} — "${r.text.trim().slice(0, 110)}"`);
        },
    },
];

const pass = (note) => ({ ok: true, note });
const fail = (note) => ({ ok: false, note });
const summCalls = (calls) => calls.length ? ' [' + calls.map((c) => c.name).join(', ') + ']' : '';

// ---------- llamada al provider (igual que el server) ----------
async function chat(model, messages) {
    const t0 = performance.now();
    const res = await fetch(`${BASE}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM }, ...messages], tools: TOOLS, stream: false }),
    });
    const ms = Math.round(performance.now() - t0);
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        return { error: `HTTP ${res.status}: ${body}`, ms };
    }
    const payload = await res.json();
    const msg = payload.choices?.[0]?.message ?? {};
    const toolCalls = (msg.tool_calls ?? []).map((tc) => {
        let args = {}; let parseError = false;
        try { args = JSON.parse(tc.function?.arguments || '{}'); } catch { parseError = true; }
        return { name: tc.function?.name ?? '?', args, parseError };
    });
    return { text: msg.content ?? '', toolCalls, ms, usage: payload.usage };
}

// ---------- comandos ----------
const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'models') {
    const res = await fetch(`${BASE}/v1/models`, { headers: { Authorization: `Bearer ${KEY}` } });
    if (!res.ok) {
        console.log(`GET ${BASE}/v1/models → HTTP ${res.status}. ${(await res.text()).slice(0, 200)}`);
        process.exit(0);
    }
    const body = await res.json();
    const ids = (body.data ?? body.models ?? []).map((m) => m.id ?? m.name);
    console.log(ids.length ? ids.join('\n') : JSON.stringify(body).slice(0, 500));
} else if (cmd === 'eval') {
    if (args.length === 0) { console.error('Uso: eval <modelId> ...'); process.exit(1); }
    const results = {};
    for (const model of args) {
        console.log(`\n=== ${model} ===`);
        results[model] = { pass: 0, total: 0, latencies: [] };
        for (const sc of scenarios) {
            const r = await chat(model, sc.messages);
            results[model].total++;
            if (r.error) {
                console.log(`  ✗ ${sc.id} (${r.ms}ms) — ${r.error}`);
                continue;
            }
            results[model].latencies.push(r.ms);
            const verdict = sc.judge(r);
            if (verdict.ok) results[model].pass++;
            console.log(`  ${verdict.ok ? '✓' : '✗'} ${sc.id} (${r.ms}ms) — ${verdict.note}`);
        }
    }
    console.log('\n=== Resumen ===');
    for (const [model, r] of Object.entries(results)) {
        const avg = r.latencies.length ? Math.round(r.latencies.reduce((a, b) => a + b, 0) / r.latencies.length) : '-';
        console.log(`${model.padEnd(28)} ${r.pass}/${r.total} pass, latencia media ${avg}ms`);
    }
} else {
    console.error('Uso: node model-eval.mjs models | eval <modelId> ...');
    process.exit(1);
}
