import { Command, RequestHandler } from '@nbottarini/cqbus';

import { AuthenticatedUser } from '../services/AuthenticatedUser';
import { RegisterUser } from '../services/RegisterUser';

export type RegisterUserInput = {
    email: string;
    displayName: string;
    password: string;
};

export type AuthSessionResult = {
    sessionToken: string;
    user: AuthenticatedUser;
};

export class RegisterUserCommand extends Command<AuthSessionResult> {
    constructor(readonly input: RegisterUserInput) {
        super();
    }
}

export class RegisterUserCommandHandler implements RequestHandler<RegisterUserCommand, AuthSessionResult> {
    constructor(private readonly registerUser: Pick<RegisterUser, 'execute'>) {}

    async handle(command: RegisterUserCommand): Promise<AuthSessionResult> {
        return this.registerUser.execute(command.input);
    }
}
