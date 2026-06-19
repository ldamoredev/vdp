import { Command, Identity, RequestHandler } from '@nbottarini/cqbus';

import { requireUserIdentity } from '../../common/app/auth/UserIdentity';
import { AuthenticatedUser } from '../services/AuthenticatedUser';
import { UpdateProfile } from '../services/UpdateProfile';

export type UpdateProfileInput = {
    displayName: string;
};

export class UpdateProfileCommand extends Command<AuthenticatedUser> {
    constructor(readonly input: UpdateProfileInput) {
        super();
    }
}

export class UpdateProfileCommandHandler implements RequestHandler<UpdateProfileCommand, AuthenticatedUser> {
    constructor(private readonly updateProfile: Pick<UpdateProfile, 'execute'>) {}

    async handle(command: UpdateProfileCommand, identity: Identity): Promise<AuthenticatedUser> {
        const { userId, sessionId } = requireUserIdentity(identity);
        return this.updateProfile.execute({
            userId,
            sessionId,
            displayName: command.input.displayName,
        });
    }
}
