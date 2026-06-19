import { Identity, Query, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { GetSecurityOverview, SecurityEventView, SecuritySessionView } from '../services/GetSecurityOverview';

export type SecurityOverview = {
    sessions: SecuritySessionView[];
    events: SecurityEventView[];
};

export class GetSecurityOverviewQuery extends Query<SecurityOverview> {}

export class GetSecurityOverviewQueryHandler implements RequestHandler<GetSecurityOverviewQuery, SecurityOverview> {
    constructor(private readonly getSecurityOverview: Pick<GetSecurityOverview, 'execute'>) {}

    async handle(_query: GetSecurityOverviewQuery, identity: Identity): Promise<SecurityOverview> {
        const { userId, sessionId } = requireUserIdentity(identity);
        return this.getSecurityOverview.execute({
            userId,
            currentSessionId: sessionId,
        });
    }
}
