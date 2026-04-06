import { ModuleContext } from '../common/base/modules/ModuleContext';
import { SessionTokenAuthenticationMiddleware } from './infrastructure/http/SessionTokenAuthenticationMiddleware';
import { UserRepository } from './domain/UserRepository';
import { SessionRepository } from './domain/SessionRepository';
import { AuditLogRepository } from './domain/AuditLogRepository';
import { PasswordService } from './services/PasswordService';
import { SessionService } from './services/SessionService';
import { GetSetupStatus } from './services/GetSetupStatus';
import { RegisterUser } from './services/RegisterUser';
import { LoginUser } from './services/LoginUser';
import { LogoutUser } from './services/LogoutUser';
import { UpdateProfile } from './services/UpdateProfile';
import { ChangePassword } from './services/ChangePassword';
import { GetSecurityOverview } from './services/GetSecurityOverview';
import { LogoutOtherSessions } from './services/LogoutOtherSessions';
import { HttpController } from '../common/http/HttpController';
import { AuthController } from './infrastructure/http/AuthController';

export class AuthModuleRuntime {
    constructor(private deps: ModuleContext) {}

    registerServices(): void {
        const { repositories, services } = this.deps;

        services.register(PasswordService, () => new PasswordService());

        services.register(SessionService, () =>
            new SessionService(repositories.get(SessionRepository)),
        );

        services.register(GetSetupStatus, () =>
            new GetSetupStatus(repositories.get(UserRepository)),
        );

        services.register(RegisterUser, () =>
            new RegisterUser(
                repositories.get(UserRepository),
                repositories.get(AuditLogRepository),
                services.get(PasswordService),
                services.get(SessionService),
            ),
        );

        services.register(LoginUser, () =>
            new LoginUser(
                repositories.get(UserRepository),
                repositories.get(AuditLogRepository),
                services.get(PasswordService),
                services.get(SessionService),
            ),
        );

        services.register(LogoutUser, () =>
            new LogoutUser(
                repositories.get(AuditLogRepository),
                services.get(SessionService),
            ),
        );

        services.register(UpdateProfile, () =>
            new UpdateProfile(
                repositories.get(UserRepository),
                repositories.get(AuditLogRepository),
            ),
        );

        services.register(ChangePassword, () =>
            new ChangePassword(
                repositories.get(UserRepository),
                repositories.get(AuditLogRepository),
                services.get(PasswordService),
                services.get(SessionService),
            ),
        );

        services.register(GetSecurityOverview, () =>
            new GetSecurityOverview(
                services.get(SessionService),
                repositories.get(AuditLogRepository),
            ),
        );

        services.register(LogoutOtherSessions, () =>
            new LogoutOtherSessions(
                repositories.get(AuditLogRepository),
                services.get(SessionService),
            ),
        );
    }

    createMiddlewares() {
        const { services, repositories } = this.deps;
        return [
            new SessionTokenAuthenticationMiddleware(
                this.deps.authContextStorage,
                services.get(SessionService),
                repositories.get(UserRepository),
            ),
        ];
    }

    createControllers(): HttpController[] {
        const { services } = this.deps;
        return [
            new AuthController(
                services.get(GetSetupStatus),
                services.get(RegisterUser),
                services.get(LoginUser),
                services.get(LogoutUser),
                services.get(UpdateProfile),
                services.get(ChangePassword),
                services.get(GetSecurityOverview),
                services.get(LogoutOtherSessions),
            ),
        ];
    }
}
