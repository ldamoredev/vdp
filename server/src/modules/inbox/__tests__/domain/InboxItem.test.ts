import { describe, expect, it, vi } from 'vitest';

import { InboxItem } from '../../domain/InboxItem';

const baseSnapshot = {
    id: 'i1',
    ownerUserId: 'u1',
    text: 'Comprar regalo de cumpleaños',
    note: null,
    status: 'pending',
    routedTo: null,
    triagedAt: null,
    suggestedDestination: null,
    suggestedAt: null,
    createdAt: new Date('2026-06-29T10:00:00.000Z'),
    updatedAt: new Date('2026-06-29T10:00:00.000Z'),
};

describe('InboxItem', () => {
    it('round-trips a snapshot and trims the text', () => {
        const item = InboxItem.fromSnapshot({ ...baseSnapshot, text: '  hola  ' });

        expect(item.toSnapshot()).toMatchObject({
            id: 'i1',
            text: 'hola',
            status: 'pending',
            routedTo: null,
        });
        expect(item.isPending()).toBe(true);
    });

    it('discards a pending item and stamps updatedAt', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));
        const item = InboxItem.fromSnapshot(baseSnapshot);

        item.discard();

        expect(item.toSnapshot()).toMatchObject({
            status: 'discarded',
            updatedAt: new Date('2026-06-29T12:00:00.000Z'),
        });
        vi.useRealTimers();
    });

    it('triages a pending item, recording the destination and timestamp', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));
        const item = InboxItem.fromSnapshot(baseSnapshot);

        item.triage('wallet');

        expect(item.toSnapshot()).toMatchObject({
            status: 'triaged',
            routedTo: 'wallet',
            triagedAt: new Date('2026-06-29T12:00:00.000Z'),
        });
        expect(() => item.triage('   ')).toThrow(/target/i);
        vi.useRealTimers();
    });

    it('suggests a destination for a pending item, recording the timestamp', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-29T12:00:00.000Z'));
        const item = InboxItem.fromSnapshot(baseSnapshot);

        item.suggestDestination('tasks');

        expect(item.toSnapshot()).toMatchObject({
            status: 'pending',
            suggestedDestination: 'tasks',
            suggestedAt: new Date('2026-06-29T12:00:00.000Z'),
        });
        vi.useRealTimers();
    });

    it('does not suggest a destination once the item left pending', () => {
        const item = InboxItem.fromSnapshot(baseSnapshot);
        item.discard();

        item.suggestDestination('wallet');

        expect(item.toSnapshot()).toMatchObject({
            status: 'discarded',
            suggestedDestination: null,
            suggestedAt: null,
        });
    });

    it('rejects empty text and invalid status', () => {
        expect(() => InboxItem.fromSnapshot({ ...baseSnapshot, text: '   ' })).toThrow(/text/i);
        expect(() => InboxItem.fromSnapshot({ ...baseSnapshot, status: 'nope' })).toThrow(/status/i);
    });
});
