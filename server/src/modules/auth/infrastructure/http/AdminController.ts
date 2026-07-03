import { updateAppSettingsSchema, UpdateAppSettingsInput } from '@vdp/shared';
import { CQBus } from '@nbottarini/cqbus';

import { executionContextFromAuth } from '../../../common/app/auth/AuthExecutionContext';
import { HttpController, RouteRegister } from '../../../common/http/HttpController';
import { RouteContextHandler } from '../../../common/http/routes';
import { GetAppSettingsQuery } from '../../app/GetAppSettingsQuery';
import { UpdateAppSettingsCommand } from '../../app/UpdateAppSettingsCommand';

export class AdminController extends HttpController {
    readonly prefix = '/api/v1/admin';

    constructor(private readonly bus: CQBus) {
        super();
    }

    registerRoutes(routes: RouteRegister): void {
        routes
            .get('/settings', {}, this.settings)
            .put('/settings', { body: updateAppSettingsSchema }, this.updateSettings);
    }

    private readonly settings: RouteContextHandler<undefined, undefined, undefined> = async ({
        request,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(new GetAppSettingsQuery(), executionContextFromAuth(request.auth)),
        );
    };

    private readonly updateSettings: RouteContextHandler<undefined, undefined, UpdateAppSettingsInput> = async ({
        request,
        body,
        reply,
    }) => {
        return reply.send(
            await this.bus.execute(
                new UpdateAppSettingsCommand(body!),
                executionContextFromAuth(request.auth),
            ),
        );
    };
}
