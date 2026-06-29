import { captureInboxItemSchema, inboxItemIdParamsSchema } from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';
import { z } from 'zod';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { assertFound } from '../../../common/http/errors';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { sendCreated } from '../../../common/http/responses';
import { RouteContextHandler } from '../../../common/http/routes';
import { CaptureInboxItemCommand } from '../../app/CaptureInboxItemCommand';
import { DiscardInboxItemCommand } from '../../app/DiscardInboxItemCommand';
import { GetInboxItemQuery } from '../../app/GetInboxItemQuery';
import { ListInboxItemsQuery } from '../../app/ListInboxItemsQuery';
import { serializeInboxItem } from '../../app/serialize';

type InboxItemIdParams = z.infer<typeof inboxItemIdParamsSchema>;
type CaptureInboxItemBody = z.infer<typeof captureInboxItemSchema>;

export class InboxController extends HttpController {
    readonly prefix = '/api/v1/inbox';

    constructor(private readonly bus: CQBus) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/', {}, this.listItems)
            .get('/:id', { params: inboxItemIdParamsSchema }, this.getItem)
            .post('/', { body: captureInboxItemSchema }, this.captureItem)
            .post('/:id/discard', { params: inboxItemIdParamsSchema }, this.discardItem);
    }

    private readonly listItems: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        const items = await this.bus.execute(
            new ListInboxItemsQuery(),
            executionContextFromAuth(request.auth),
        );
        return reply.send({ items: items.map(serializeInboxItem) });
    };

    private readonly getItem: RouteContextHandler<InboxItemIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const item = assertFound(
            await this.bus.execute(new GetInboxItemQuery(params!.id), executionContextFromAuth(request.auth)),
            'Inbox item not found',
        );
        return reply.send(serializeInboxItem(item));
    };

    private readonly captureItem: RouteContextHandler<undefined, undefined, CaptureInboxItemBody> = async ({
        request,
        body,
        reply,
    }) => {
        const item = await this.bus.execute(
            new CaptureInboxItemCommand(body!),
            executionContextFromAuth(request.auth),
        );
        return sendCreated(reply, serializeInboxItem(item));
    };

    private readonly discardItem: RouteContextHandler<InboxItemIdParams, undefined, undefined> = async ({
        request,
        params,
        reply,
    }) => {
        const item = assertFound(
            await this.bus.execute(new DiscardInboxItemCommand(params!.id), executionContextFromAuth(request.auth)),
            'Inbox item not found',
        );
        return reply.send(serializeInboxItem(item));
    };
}
