import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { LogoutOtherSessions } from '../services/LogoutOtherSessions';

export type LogoutOtherSessionsResult = {
    revokedSessions: number;
};

export class LogoutOtherSessionsCommand extends Command<LogoutOtherSessionsResult> {}

export class LogoutOtherSessionsCommandHandler
implements RequestHandler<LogoutOtherSessionsCommand, LogoutOtherSessionsResult> {
    constructor(private readonly logoutOtherSessions: Pick<LogoutOtherSessions, 'execute'>) {}

    async handle(_command: LogoutOtherSessionsCommand, identity: Identity): Promise<LogoutOtherSessionsResult> {
        const { userId, sessionId } = requireUserIdentity(identity);
        return this.logoutOtherSessions.execute({
            userId,
            currentSessionId: sessionId,
        });
    }
}
