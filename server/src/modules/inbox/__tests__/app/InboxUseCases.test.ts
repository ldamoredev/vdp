import { describe, expect, it } from 'vitest';

import { UserIdentity } from '../../../common/app/auth/UserIdentity';
import { CaptureInboxItemCommand, CaptureInboxItemCommandHandler } from '../../app/CaptureInboxItemCommand';
import { DiscardInboxItemCommand, DiscardInboxItemCommandHandler } from '../../app/DiscardInboxItemCommand';
import { GetInboxItemQuery, GetInboxItemQueryHandler } from '../../app/GetInboxItemQuery';
import { ListInboxItemsQuery, ListInboxItemsQueryHandler } from '../../app/ListInboxItemsQuery';
import { TriageInboxItemCommand, TriageInboxItemCommandHandler } from '../../app/TriageInboxItemCommand';
import { FakeInboxItemRepository } from '../fakes/FakeInboxItemRepository';

const identity = new UserIdentity('user-1', 'test@example.com', 'Test', ['user']);
const otherIdentity = new UserIdentity('user-2', 'other@example.com', 'Other', ['user']);

describe('Inbox use cases', () => {
    it('captures a pending item and lists it for the authenticated user', async () => {
        const items = new FakeInboxItemRepository();
        const created = await new CaptureInboxItemCommandHandler(items)
            .handle(new CaptureInboxItemCommand({ text: 'Idea para el blog' }), identity);

        const listed = await new ListInboxItemsQueryHandler(items)
            .handle(new ListInboxItemsQuery(), identity);

        expect(created).toMatchObject({ text: 'Idea para el blog', status: 'pending', routedTo: null });
        expect(listed.map((item) => item.id)).toEqual([created.id]);
    });

    it('discards a captured item', async () => {
        const items = new FakeInboxItemRepository();
        const created = await new CaptureInboxItemCommandHandler(items)
            .handle(new CaptureInboxItemCommand({ text: 'Algo' }), identity);

        const discarded = await new DiscardInboxItemCommandHandler(items)
            .handle(new DiscardInboxItemCommand(created.id), identity);

        expect(discarded?.status).toBe('discarded');
    });

    it('triages a captured item to a destination', async () => {
        const items = new FakeInboxItemRepository();
        const created = await new CaptureInboxItemCommandHandler(items)
            .handle(new CaptureInboxItemCommand({ text: 'Pagar la luz' }), identity);

        const triaged = await new TriageInboxItemCommandHandler(items)
            .handle(new TriageInboxItemCommand(created.id, 'wallet'), identity);

        expect(triaged).toMatchObject({ status: 'triaged', routedTo: 'wallet' });
    });

    it('does not expose or discard another user inbox items', async () => {
        const items = new FakeInboxItemRepository();
        const created = await new CaptureInboxItemCommandHandler(items)
            .handle(new CaptureInboxItemCommand({ text: 'Privado' }), identity);

        const read = await new GetInboxItemQueryHandler(items)
            .handle(new GetInboxItemQuery(created.id), otherIdentity);
        const discarded = await new DiscardInboxItemCommandHandler(items)
            .handle(new DiscardInboxItemCommand(created.id), otherIdentity);
        const triaged = await new TriageInboxItemCommandHandler(items)
            .handle(new TriageInboxItemCommand(created.id, 'wallet'), otherIdentity);
        const otherList = await new ListInboxItemsQueryHandler(items)
            .handle(new ListInboxItemsQuery(), otherIdentity);

        expect(read).toBeNull();
        expect(discarded).toBeNull();
        expect(triaged).toBeNull();
        expect(otherList).toEqual([]);
    });
});
