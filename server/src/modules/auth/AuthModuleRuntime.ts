import { ModuleContext } from '../common/base/modules/ModuleContext';
import { SessionTokenAuthenticationMiddleware } from './infrastructure/http/SessionTokenAuthenticationMiddleware';
import { UserRepository } from './domain/UserRepository';
import { SessionRepository } from './domain/SessionRepository';
import { AuditLogRepository } from './domain/AuditLogRepository';
import { ChangePasswordCommand, ChangePasswordCommandHandler } from './app/ChangePasswordCommand';
import { GetCurrentUserQuery, GetCurrentUserQueryHandler } from './app/GetCurrentUserQuery';
import { GetSecurityOverviewQuery, GetSecurityOverviewQueryHandler } from './app/GetSecurityOverviewQuery';
import { GetSetupStatusQuery, GetSetupStatusQueryHandler } from './app/GetSetupStatusQuery';
import { LoginUserCommand, LoginUserCommandHandler } from './app/LoginUserCommand';
import { LogoutOtherSessionsCommand, LogoutOtherSessionsCommandHandler } from './app/LogoutOtherSessionsCommand';
import { LogoutUserCommand, LogoutUserCommandHandler } from './app/LogoutUserCommand';
import { RegisterUserCommand, RegisterUserCommandHandler } from './app/RegisterUserCommand';
import { UpdateProfileCommand, UpdateProfileCommandHandler } from './app/UpdateProfileCommand';
import { PasswordService } from './services/PasswordService';
import { SessionService } from './services/SessionService';
import { GetSetupStatus } from './services/GetSetupStatus';
import { RegisterUser } from './services/RegisterUser';
import { LoginUser } from './services/LoginUser';
import { LoginRateLimiter } from './services/LoginRateLimiter';
import { LogoutUser } from './services/LogoutUser';
import { UpdateProfile } from './services/UpdateProfile';
import { ChangePassword } from './services/ChangePassword';
import { GetSecurityOverview } from './services/GetSecurityOverview';
import { LogoutOtherSessions } from './services/LogoutOtherSessions';
import { HttpController } from '../common/http/HttpController';
import { AuthController } from './infrastructure/http/AuthController';

export class AuthModuleRuntime {
    private readonly passwordService: PasswordService;
    private readonly sessionService: SessionService;
    private readonly loginRateLimiter: LoginRateLimiter;

    constructor(private deps: ModuleContext) {
        this.passwordService = new PasswordService();
        this.sessionService = new SessionService(this.sessionRepository());
        this.loginRateLimiter = new LoginRateLimiter();
    }

    registerServices(): void {
    }

    registerHandlers(): void {
        const { bus } = this.deps;

        bus.registerHandler(GetSetupStatusQuery, () => new GetSetupStatusQueryHandler(this.getSetupStatus()));
        bus.registerHandler(GetCurrentUserQuery, () => new GetCurrentUserQueryHandler());
        bus.registerHandler(RegisterUserCommand, () => new RegisterUserCommandHandler(this.registerUser()));
        bus.registerHandler(LoginUserCommand, () => new LoginUserCommandHandler(this.loginUser()));
        bus.registerHandler(LogoutUserCommand, () => new LogoutUserCommandHandler(this.logoutUser()));
        bus.registerHandler(UpdateProfileCommand, () => new UpdateProfileCommandHandler(this.updateProfile()));
        bus.registerHandler(ChangePasswordCommand, () => new ChangePasswordCommandHandler(this.changePassword()));
        bus.registerHandler(GetSecurityOverviewQuery, () =>
            new GetSecurityOverviewQueryHandler(this.getSecurityOverview()),
        );
        bus.registerHandler(LogoutOtherSessionsCommand, () =>
            new LogoutOtherSessionsCommandHandler(this.logoutOtherSessions()),
        );
    }

    createMiddlewares() {
        return [
            new SessionTokenAuthenticationMiddleware(
                this.deps.authContextStorage,
                this.sessionService,
                this.userRepository(),
            ),
        ];
    }

    createControllers(): HttpController[] {
        return [new AuthController(this.deps.bus)];
    }

    private getSetupStatus(): GetSetupStatus {
        return new GetSetupStatus(this.userRepository());
    }

    private registerUser(): RegisterUser {
        return new RegisterUser(
            this.userRepository(),
            this.auditLogRepository(),
            this.passwordService,
            this.sessionService,
        );
    }

    private loginUser(): LoginUser {
        return new LoginUser(
            this.userRepository(),
            this.auditLogRepository(),
            this.passwordService,
            this.sessionService,
            this.loginRateLimiter,
        );
    }

    private logoutUser(): LogoutUser {
        return new LogoutUser(this.auditLogRepository(), this.sessionService);
    }

    private updateProfile(): UpdateProfile {
        return new UpdateProfile(this.userRepository(), this.auditLogRepository());
    }

    private changePassword(): ChangePassword {
        return new ChangePassword(
            this.userRepository(),
            this.auditLogRepository(),
            this.passwordService,
            this.sessionService,
        );
    }

    private getSecurityOverview(): GetSecurityOverview {
        return new GetSecurityOverview(this.sessionService, this.auditLogRepository());
    }

    private logoutOtherSessions(): LogoutOtherSessions {
        return new LogoutOtherSessions(this.auditLogRepository(), this.sessionService);
    }

    private userRepository(): UserRepository {
        return this.deps.repositories.get(UserRepository);
    }

    private sessionRepository(): SessionRepository {
        return this.deps.repositories.get(SessionRepository);
    }

    private auditLogRepository(): AuditLogRepository {
        return this.deps.repositories.get(AuditLogRepository);
    }
}
