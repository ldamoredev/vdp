import { Command, RequestHandler } from '@nbottarini/cqbus';

import { AuthSessionResult } from './RegisterUserCommand';
import { LoginUser } from '../services/LoginUser';

export type LoginUserInput = {
    email: string;
    password: string;
    userAgent?: string | null;
    ipAddress?: string | null;
};

export class LoginUserCommand extends Command<AuthSessionResult> {
    constructor(readonly input: LoginUserInput) {
        super();
    }
}

export class LoginUserCommandHandler implements RequestHandler<LoginUserCommand, AuthSessionResult> {
    constructor(private readonly loginUser: Pick<LoginUser, 'execute'>) {}

    async handle(command: LoginUserCommand): Promise<AuthSessionResult> {
        return this.loginUser.execute(command.input);
    }
}
