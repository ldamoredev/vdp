import { describe, expect, it, vi } from 'vitest';

import { DolarApiExchangeRateProvider } from '../../infrastructure/exchange-rates/DolarApiExchangeRateProvider';

function jsonResponse(body: unknown): Response {
    return { ok: true, status: 200, json: async () => body } as Response;
}

describe('DolarApiExchangeRateProvider', () => {
    it('maps dolarapi casas to the wallet rate types as USD->ARS sell rates', async () => {
        const fetchFn = vi.fn().mockResolvedValue(
            jsonResponse([
                { casa: 'oficial', compra: 900, venta: 950 },
                { casa: 'blue', compra: 1280, venta: 1300 },
                { casa: 'bolsa', compra: 1240, venta: 1250 },
                { casa: 'contadoconliqui', compra: 1290, venta: 1320 },
                { casa: 'mayorista', compra: 910, venta: 915 },
                { casa: 'cripto', compra: 1310, venta: 1330 },
            ]),
        );
        const provider = new DolarApiExchangeRateProvider('https://example.test', fetchFn as never, () => '2026-06-17');

        const rates = await provider.fetchDollarRates();

        expect(fetchFn).toHaveBeenCalledWith(
            'https://example.test/v1/dolares',
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        );
        expect(rates).toEqual([
            { fromCurrency: 'USD', toCurrency: 'ARS', rate: '950.00', type: 'official', date: '2026-06-17' },
            { fromCurrency: 'USD', toCurrency: 'ARS', rate: '1300.00', type: 'blue', date: '2026-06-17' },
            { fromCurrency: 'USD', toCurrency: 'ARS', rate: '1250.00', type: 'mep', date: '2026-06-17' },
            { fromCurrency: 'USD', toCurrency: 'ARS', rate: '1320.00', type: 'ccl', date: '2026-06-17' },
        ]);
    });

    it('throws when dolarapi responds with an error status', async () => {
        const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) } as Response);
        const provider = new DolarApiExchangeRateProvider('https://example.test', fetchFn as never);

        await expect(provider.fetchDollarRates()).rejects.toThrow(/503/);
    });

    it('wraps network/timeout failures in a clear error', async () => {
        const fetchFn = vi.fn().mockRejectedValue(new DOMException('The operation timed out', 'TimeoutError'));
        const provider = new DolarApiExchangeRateProvider('https://example.test', fetchFn as never);

        await expect(provider.fetchDollarRates()).rejects.toThrow(/dolarapi request failed/i);
    });
});
