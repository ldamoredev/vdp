import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { ChangePassword } from '../services/ChangePassword';

export type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};

export class ChangePasswordCommand extends Command<void> {
    constructor(readonly input: ChangePasswordInput) {
        super();
    }
}

export class ChangePasswordCommandHandler implements RequestHandler<ChangePasswordCommand, void> {
    constructor(private readonly changePassword: Pick<ChangePassword, 'execute'>) {}

    async handle(command: ChangePasswordCommand, identity: Identity): Promise<void> {
        const { userId, sessionId } = requireUserIdentity(identity);
        await this.changePassword.execute({
            userId,
            sessionId,
            currentPassword: command.input.currentPassword,
            newPassword: command.input.newPassword,
        });
    }
}
