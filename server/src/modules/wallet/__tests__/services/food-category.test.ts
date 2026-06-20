import { describe, it, expect } from 'vitest';

import { isFoodCategory } from '../../services/food-category';

describe('isFoodCategory', () => {
    it.each([
        'Comida',
        'Delivery',
        'Comida rápida',
        'Restaurante',
        'Resto',
        'Pedidos Ya',
        'Rappi',
        'Bar',
        'Café',
        'Almuerzo',
        'Cena afuera',
        'Pizzería',
        'Sushi',
        'Heladería',
    ])('flags "%s" as eating-out / delivery spend', (name) => {
        expect(isFoodCategory(name)).toBe(true);
    });

    it.each([
        'Transporte',
        'Alquiler',
        'Supermercado', // groceries are not the eating-out / delivery signal
        'Nafta',
        'Salud',
        'Servicios',
        'Sueldo',
        '',
    ])('does not flag "%s"', (name) => {
        expect(isFoodCategory(name)).toBe(false);
    });
});
