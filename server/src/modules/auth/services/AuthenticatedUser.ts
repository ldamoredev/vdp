import { UserRole } from '../../common/http/AuthContext';

export type AuthenticatedUser = {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
};
