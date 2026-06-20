/**
 * Heuristic: does a spending category represent eating-out / delivery — the kind
 * of spend that contextualizes an active weight/diet goal? Detection is by
 * category name (accent- and case-insensitive, whole-word). Groceries
 * ("supermercado") are deliberately excluded: the diet-relevant signal is
 * prepared food and delivery, not the weekly shop. Like the payment-intent
 * heuristic, this is a contextual read — a miss just omits a number, never nags.
 */
const FOOD_WORDS = new Set([
    'comida', 'comidas',
    'delivery',
    'restaurante', 'restaurant', 'resto',
    'pedidos', 'pedidosya', 'rappi',
    'bar', 'bares', 'cafe', 'cafeteria',
    'almuerzo', 'almuerzos', 'cena', 'cenas', 'merienda',
    'pizza', 'pizzeria', 'sushi', 'hamburguesa', 'burger', 'empanadas',
    'helado', 'heladeria',
    'vianda', 'viandas', 'takeaway',
]);

function normalize(text: string): string[] {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z]+/)
        .filter(Boolean);
}

export function isFoodCategory(name: string): boolean {
    return normalize(name).some((word) => FOOD_WORDS.has(word));
}
