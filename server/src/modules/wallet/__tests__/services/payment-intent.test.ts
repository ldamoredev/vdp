import { describe, it, expect } from 'vitest';

import { isPaymentTask } from '../../services/payment-intent';

describe('isPaymentTask', () => {
    it.each([
        'Pagar el alquiler',
        'Pagar luz y gas',
        'Pagué la tarjeta', // accent + past tense
        'Pagá el seguro', // Argentine imperative
        'Abonar el monotributo',
        'Transferir a Juan',
        'Transferí el adelanto',
        'Depositar en la caja de ahorro',
        'Comprar regalo de cumpleaños',
        'Comprá las entradas',
        'Saldar la deuda con Ana',
    ])('detects a payment in "%s"', (title) => {
        expect(isPaymentTask(title)).toBe(true);
    });

    it.each([
        'Revisar gasto semanal: subió 60%', // cross-domain review task, not a payment
        'Sostener hábito: Gimnasio',
        'Llamar al dentista',
        'Comprobar el estado del trámite', // "comprobar" must not match "comprar"
        'Responder mail de laburo',
        '',
        '   ',
    ])('does not flag "%s"', (title) => {
        expect(isPaymentTask(title)).toBe(false);
    });

    it('is robust to extra punctuation and casing', () => {
        expect(isPaymentTask('  PAGAR: el ABL  ')).toBe(true);
        expect(isPaymentTask('Comprar, urgente, la birra')).toBe(true);
    });
});
