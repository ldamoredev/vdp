export type UserRole = 'user' | 'superadmin';

export interface AuthContext {
    isAuthenticated: boolean;
    userId: string | null;
    sessionId: string | null;
    role: UserRole | null;
    email: string | null;
    displayName: string | null;
}
