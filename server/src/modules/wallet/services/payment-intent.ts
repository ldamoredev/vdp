/**
 * Heuristic: does a completed task represent money leaving the wallet that the
 * user likely wants to register? Detection is title-based — Spanish payment
 * verbs (infinitive, Argentine voseo imperative, and first-person past),
 * accent- and case-insensitive — and intentionally conservative. The output is
 * a dismissable suggestion, so a false negative just means no nudge and a false
 * positive costs one easily-ignored card. Whole-word matching keeps lookalikes
 * like "comprobar" from matching "comprar".
 */
const PAYMENT_WORDS = new Set([
    'pagar', 'paga', 'pague', 'pago',
    'abonar', 'abona', 'abone', 'abono',
    'transferir', 'transferi', 'transfiere',
    'depositar', 'deposita', 'deposite', 'deposito',
    'comprar', 'compra', 'compre', 'compro',
    'saldar', 'salda', 'salde',
]);

function normalize(text: string): string[] {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z]+/)
        .filter(Boolean);
}

export function isPaymentTask(title: string): boolean {
    return normalize(title).some((word) => PAYMENT_WORDS.has(word));
}
