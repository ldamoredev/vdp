import { Command, RequestHandler } from '@nbottarini/cqbus';

import { LogoutUser } from '../services/LogoutUser';

export class LogoutUserCommand extends Command<void> {
    constructor(readonly sessionToken: string | null) {
        super();
    }
}

export class LogoutUserCommandHandler implements RequestHandler<LogoutUserCommand, void> {
    constructor(private readonly logoutUser: Pick<LogoutUser, 'execute'>) {}

    async handle(command: LogoutUserCommand): Promise<void> {
        if (!command.sessionToken) return;
        await this.logoutUser.execute(command.sessionToken);
    }
}
